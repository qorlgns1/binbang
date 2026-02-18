import { prisma } from '@workspace/db';

/**
 * Rate Limiting 서비스
 * - In-memory Map 기반 (초기 구현)
 * - 프로덕션에서는 Redis 사용 권장
 */

interface RateLimitData {
  dailyCount: number;
  dailyResetAt: Date;
  conversationCounts: Map<string, number>;
}

// In-memory storage
const rateLimitStore = new Map<string, RateLimitData>();

function readPositiveIntEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? `${fallback}`, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// 제한 정책
export const GUEST_LIMITS = {
  daily: readPositiveIntEnv('TRAVEL_GUEST_DAILY_LIMIT', 1), // 기본: 1
  perConversation: readPositiveIntEnv('TRAVEL_GUEST_PER_CONVERSATION_LIMIT', 5), // 기본: 5턴
};

export const USER_LIMITS = {
  daily: 20,
  perConversation: 50,
};

interface RateLimitCheck {
  allowed: boolean;
  reason?: string;
}

interface RateLimits {
  daily: number;
  perConversation: number;
}

function getDailyWindow(now: Date) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function formatResetTime(resetAt: Date): string {
  return resetAt.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 게스트 한도는 DB 기준으로 강제한다.
 * - in-memory 상태 초기화(개발 리로드, 런타임 재시작)에 영향받지 않음
 */
export async function checkGuestRateLimitPersistent(
  sessionId: string,
  limits: RateLimits,
  conversationId?: string,
): Promise<RateLimitCheck> {
  const now = new Date();
  const { start: dayStart, end: dayEnd } = getDailyWindow(now);
  const normalizedConversationId = conversationId?.trim() || undefined;

  let isNewConversationAttempt = true;

  if (normalizedConversationId) {
    const existingConversation = await prisma.travelConversation.findFirst({
      where: {
        id: normalizedConversationId,
        sessionId,
      },
      select: { id: true },
    });

    isNewConversationAttempt = !existingConversation;
  }

  if (isNewConversationAttempt) {
    const dailyConversationCount = await prisma.travelConversation.count({
      where: {
        sessionId,
        createdAt: {
          gte: dayStart,
          lt: dayEnd,
        },
      },
    });

    if (dailyConversationCount >= limits.daily) {
      return {
        allowed: false,
        reason: `일일 대화 생성 한도(${limits.daily}개)에 도달했습니다. ${formatResetTime(dayEnd)}에 리셋됩니다.`,
      };
    }
  }

  if (normalizedConversationId) {
    const conversationUserMessageCount = await prisma.travelMessage.count({
      where: {
        conversationId: normalizedConversationId,
        role: 'user',
        conversation: {
          sessionId,
        },
      },
    });

    if (conversationUserMessageCount >= limits.perConversation) {
      return {
        allowed: false,
        reason: `이 대화의 메시지 한도(${limits.perConversation}개)에 도달했습니다.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Rate limit 확인
 */
export async function checkRateLimit(
  key: string,
  limits: RateLimits,
  conversationId?: string,
): Promise<RateLimitCheck> {
  const now = new Date();
  let data = rateLimitStore.get(key);

  // 데이터 초기화 또는 일일 리셋
  if (!data || data.dailyResetAt <= now) {
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);

    data = {
      dailyCount: 0,
      dailyResetAt: tomorrow,
      conversationCounts: new Map(),
    };
    rateLimitStore.set(key, data);
  }

  const normalizedConversationId = conversationId?.trim();
  const isKnownConversation = normalizedConversationId
    ? data.conversationCounts.has(normalizedConversationId)
    : false;
  const isNewConversationAttempt = !normalizedConversationId || !isKnownConversation;

  // 일일 대화 생성 한도 확인 (새 대화 시작 시)
  if (isNewConversationAttempt && data.dailyCount >= limits.daily) {
    const resetTime = data.dailyResetAt.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return {
      allowed: false,
      reason: `일일 대화 생성 한도(${limits.daily}개)에 도달했습니다. ${resetTime}에 리셋됩니다.`,
    };
  }

  // 대화당 메시지 한도 확인
  if (normalizedConversationId) {
    const conversationCount = data.conversationCounts.get(normalizedConversationId) ?? 0;
    if (conversationCount >= limits.perConversation) {
      return {
        allowed: false,
        reason: `이 대화의 메시지 한도(${limits.perConversation}개)에 도달했습니다.`,
      };
    }
  }

  return { allowed: true };
}

/**
 * 카운터 증가
 */
export function incrementCount(key: string, conversationId: string, isNewConversation: boolean): void {
  const data = rateLimitStore.get(key);
  if (!data) return;

  if (isNewConversation) {
    data.dailyCount += 1;
  }

  const currentCount = data.conversationCounts.get(conversationId) ?? 0;
  data.conversationCounts.set(conversationId, currentCount + 1);
}

/**
 * 일일 리셋 (수동 호출용)
 */
export function resetDaily(): void {
  rateLimitStore.clear();
}

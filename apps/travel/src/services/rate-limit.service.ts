import { prisma } from '@workspace/db';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';

/**
 * Rate Limiting 서비스
 *
 * 체크 전략:
 * - guest: DB 기반 persistent check (기본) / in-memory fallback (DB 장애 시)
 * - user:  DB 기반 persistent check
 *
 * 한계:
 * - 스트리밍 시작~완료 사이의 동시 요청은 한도를 1~2회 초과할 수 있음(스트리밍 특성상 허용 수준)
 * - Redis 도입 시 이 파일의 DB 체크를 대체하고 원자적 카운터로 전환
 */

interface RateLimitData {
  dailyCount: number;
  dailyResetAt: Date;
  conversationCounts: Map<string, number>;
}

// In-memory storage (게스트 DB 장애 시 fallback 전용)
const rateLimitStore = new Map<string, RateLimitData>();

function readPositiveIntEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? `${fallback}`, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// 제한 정책
export const GUEST_LIMITS = {
  daily: readPositiveIntEnv('TRAVEL_GUEST_DAILY_LIMIT', 1),
  perConversation: readPositiveIntEnv('TRAVEL_GUEST_PER_CONVERSATION_LIMIT', 5),
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

type OwnerFilter = { type: 'session'; sessionId: string } | { type: 'user'; userId: string };

const KST = 'Asia/Seoul';

function getDailyWindow(now: Date) {
  const zonedNow = toZonedTime(now, KST);
  const startLocal = new Date(zonedNow.getFullYear(), zonedNow.getMonth(), zonedNow.getDate(), 0, 0, 0, 0);
  const endLocal = new Date(zonedNow.getFullYear(), zonedNow.getMonth(), zonedNow.getDate() + 1, 0, 0, 0, 0);
  return {
    start: fromZonedTime(startLocal, KST),
    end: fromZonedTime(endLocal, KST),
  };
}

function formatResetTime(resetAt: Date): string {
  return formatInTimeZone(resetAt, KST, 'HH:mm');
}

/**
 * DB 기반 Rate limit 체크 공통 헬퍼
 * guest(sessionId)와 user(userId) 양쪽에서 재사용한다.
 */
async function checkRateLimitPersistentByOwner(
  owner: OwnerFilter,
  limits: RateLimits,
  conversationId?: string,
): Promise<RateLimitCheck> {
  const now = new Date();
  const { start: dayStart, end: dayEnd } = getDailyWindow(now);
  const normalizedConversationId = conversationId?.trim() || undefined;

  let isNewConversationAttempt = true;

  if (normalizedConversationId) {
    const existingConversation = await prisma.travelConversation.findFirst({
      where:
        owner.type === 'session'
          ? { id: normalizedConversationId, sessionId: owner.sessionId }
          : { id: normalizedConversationId, userId: owner.userId },
      select: { id: true },
    });

    isNewConversationAttempt = !existingConversation;
  }

  if (isNewConversationAttempt) {
    const dailyConversationCount = await prisma.travelConversation.count({
      where:
        owner.type === 'session'
          ? { sessionId: owner.sessionId, createdAt: { gte: dayStart, lt: dayEnd } }
          : { userId: owner.userId, createdAt: { gte: dayStart, lt: dayEnd } },
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
        conversation: owner.type === 'session' ? { sessionId: owner.sessionId } : { userId: owner.userId },
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
 * 게스트 한도 체크 (DB 기반)
 * - 서버리스 인스턴스 재시작에 영향받지 않음
 */
export async function checkGuestRateLimitPersistent(
  sessionId: string,
  limits: RateLimits,
  conversationId?: string,
): Promise<RateLimitCheck> {
  return checkRateLimitPersistentByOwner({ type: 'session', sessionId }, limits, conversationId);
}

/**
 * 인증 사용자 한도 체크 (DB 기반)
 * - in-memory 방식과 달리 다중 서버리스 인스턴스 간 상태를 공유한다
 */
export async function checkUserRateLimitPersistent(
  userId: string,
  limits: RateLimits,
  conversationId?: string,
): Promise<RateLimitCheck> {
  return checkRateLimitPersistentByOwner({ type: 'user', userId }, limits, conversationId);
}

/**
 * In-memory Rate limit 확인 (게스트 DB 장애 시 fallback 전용)
 */
export async function checkRateLimit(
  key: string,
  limits: RateLimits,
  conversationId?: string,
): Promise<RateLimitCheck> {
  const now = new Date();
  let data = rateLimitStore.get(key);

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
  const isKnownConversation = normalizedConversationId ? data.conversationCounts.has(normalizedConversationId) : false;
  const isNewConversationAttempt = !normalizedConversationId || !isKnownConversation;

  if (isNewConversationAttempt && data.dailyCount >= limits.daily) {
    const resetTime = formatResetTime(data.dailyResetAt);
    return {
      allowed: false,
      reason: `일일 대화 생성 한도(${limits.daily}개)에 도달했습니다. ${resetTime}에 리셋됩니다.`,
    };
  }

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
 * In-memory 카운터 증가 (게스트 in-memory fallback 경로 전용)
 * conversationId는 trim하여 checkRateLimit과 동일한 정규화 규칙 적용
 */
export function incrementCount(key: string, conversationId: string, isNewConversation: boolean): void {
  const data = rateLimitStore.get(key);
  if (!data) return;

  const normalizedId = conversationId?.trim() ?? '';
  if (!normalizedId) return;

  if (isNewConversation) {
    data.dailyCount += 1;
  }

  const currentCount = data.conversationCounts.get(normalizedId) ?? 0;
  data.conversationCounts.set(normalizedId, currentCount + 1);
}

/**
 * 일일 리셋 (수동 호출용)
 */
export function resetDaily(): void {
  rateLimitStore.clear();
}

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

// 제한 정책
export const GUEST_LIMITS = {
  daily: 5, // 일일 대화 생성 한도
  perConversation: 20, // 대화당 메시지 한도
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

  // 일일 대화 생성 한도 확인 (새 대화 시작 시)
  if (!conversationId && data.dailyCount >= limits.daily) {
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
  if (conversationId) {
    const conversationCount = data.conversationCounts.get(conversationId) ?? 0;
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

import type { ModelMessage } from 'ai';

/**
 * Sliding Window 컨텍스트 관리
 * - 긴 대화에서 최근 N턴만 LLM에 전달하여 토큰 비용 절감
 * - 시스템 프롬프트는 항상 유지
 */
export function applyContextWindow(messages: ModelMessage[], maxTurns = 10): ModelMessage[] {
  // 시스템 메시지와 대화 메시지 분리
  const systemMessages = messages.filter((m) => m.role === 'system');
  const conversationMessages = messages.filter((m) => m.role !== 'system');

  // 최근 maxTurns*2개 메시지만 (user+assistant 각 1개씩)
  const recentMessages = conversationMessages.slice(-(maxTurns * 2));

  return [...systemMessages, ...recentMessages];
}

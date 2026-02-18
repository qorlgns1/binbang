import type { ModelMessage } from 'ai';

const DEFAULT_MAX_TURNS = 10;

/**
 * Sliding Window 컨텍스트 관리
 * - 긴 대화에서 최근 N턴만 LLM에 전달하여 토큰 비용 절감
 * - 시스템 프롬프트는 항상 유지
 * - maxTurns가 0/NaN이면 기본값 적용해 토큰 절감이 무력화되지 않도록 함
 */
export function applyContextWindow(messages: ModelMessage[], maxTurns = DEFAULT_MAX_TURNS): ModelMessage[] {
  const safeTurns =
    typeof maxTurns === 'number' && Number.isFinite(maxTurns) && maxTurns > 0
      ? Math.floor(maxTurns)
      : DEFAULT_MAX_TURNS;

  const conversationIndexes = messages.map((m, idx) => (m.role === 'system' ? -1 : idx)).filter((idx) => idx >= 0);
  const keepConversation = new Set(conversationIndexes.slice(-(safeTurns * 2)));

  return messages.filter((m, idx) => m.role === 'system' || keepConversation.has(idx));
}

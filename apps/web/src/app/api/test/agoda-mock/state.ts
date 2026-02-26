// 테스트 전용 — production에서는 사용되지 않음
export type AgodaMockScenario = 'sold_out' | 'available';

// Next.js dev 서버 프로세스 내 모듈 싱글턴으로 시나리오 공유
const mockState = {
  scenario: 'sold_out' as AgodaMockScenario,
};

export function getAgodaMockScenario(): AgodaMockScenario {
  return mockState.scenario;
}

export function setAgodaMockScenario(scenario: AgodaMockScenario): void {
  mockState.scenario = scenario;
}

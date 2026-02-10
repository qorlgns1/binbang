import type { ActionCardColorScheme, ActionCardType, BoardTab, CtaAction, StatusType } from './types';

// ============================================================================
// CP-001 ~ CP-002: 페이지 텍스트
// ============================================================================

export const PAGE_TITLE = '대시보드';
export const PAGE_SUBTITLE = '지금 처리할 항목을 먼저 확인하세요';

// ============================================================================
// CP-003: KPI 라벨
// ============================================================================

export const KPI_LABELS = {
  total: '전체 숙소',
  active: '활성 숙소',
  problem: '문제 숙소',
  quota: '한도 사용률',
} as const;

// ============================================================================
// CP-004 ~ CP-006: 공통 오류 텍스트
// ============================================================================

export const ERROR_TITLE = '데이터를 불러오지 못했습니다';
export const ERROR_DESCRIPTION = '네트워크 상태를 확인하고 다시 시도해주세요';
export const ERROR_BUTTON = '다시 시도';

// ============================================================================
// CP-007 ~ CP-008: Action 빈 상태
// ============================================================================

export const ACTION_EMPTY_TITLE = '즉시 처리할 항목이 없습니다';
export const ACTION_EMPTY_DESCRIPTION = '현재 모니터링 상태가 안정적입니다.';

// ============================================================================
// CP-010 ~ CP-024: Action 카드 텍스트
// ============================================================================

export const ACTION_CARD_CONFIG: Record<
  ActionCardType,
  {
    title: string;
    description: string;
    ctaLabel: string;
    ctaAction: CtaAction;
    colorScheme: ActionCardColorScheme;
  }
> = {
  QUOTA_REACHED: {
    title: '숙소 한도에 도달했습니다',
    description: '새 숙소 등록이 제한됩니다. 불필요한 숙소를 정리하거나 플랜을 변경하세요.',
    ctaLabel: '플랜 확인하기',
    ctaAction: 'navigate_pricing',
    colorScheme: 'critical',
  },
  QUOTA_NEAR_LIMIT: {
    title: '숙소 한도가 거의 찼습니다',
    description: '현재 사용량이 80% 이상입니다. 곧 새 숙소 등록이 제한될 수 있습니다.',
    ctaLabel: '플랜 확인하기',
    ctaAction: 'navigate_pricing',
    colorScheme: 'warning',
  },
  NOTIFICATION_NOT_CONNECTED: {
    title: '알림 채널이 연결되지 않았습니다',
    description: '빈방 발생 시 즉시 알림을 받으려면 카카오 연동이 필요합니다.',
    ctaLabel: '카카오 연동하기',
    ctaAction: 'navigate_kakao',
    colorScheme: 'warning',
  },
  RECENT_ERROR_DETECTED: {
    title: '최근 체크 오류가 감지되었습니다',
    description: '일부 숙소에서 상태 확인 실패가 발생했습니다. 문제 숙소를 먼저 점검하세요.',
    ctaLabel: '문제 숙소 보기',
    ctaAction: 'switch_tab_problem',
    colorScheme: 'critical',
  },
  PAUSED_ACCOMMODATIONS_EXIST: {
    title: '일시정지된 숙소가 있습니다',
    description: '모니터링이 중단된 숙소가 있어 알림을 받지 못할 수 있습니다.',
    ctaLabel: '일시정지 숙소 보기',
    ctaAction: 'switch_tab_paused',
    colorScheme: 'info',
  },
};

// ============================================================================
// FR-021: Action 카드 우선순위
// ============================================================================

export const ACTION_CARD_PRIORITY: Record<ActionCardType, number> = {
  QUOTA_REACHED: 100,
  RECENT_ERROR_DETECTED: 90,
  NOTIFICATION_NOT_CONNECTED: 80,
  QUOTA_NEAR_LIMIT: 70,
  PAUSED_ACCOMMODATIONS_EXIST: 60,
};

// ============================================================================
// DF-011: 심각도 점수
// ============================================================================

export const SEVERITY_SCORE: Record<string, number> = {
  ERROR: 3,
  UNKNOWN: 2,
  UNAVAILABLE: 1,
  AVAILABLE: 0,
};

// ============================================================================
// CP-025: 보드 탭 라벨
// ============================================================================

export const BOARD_TAB_LABELS: Record<BoardTab, string> = {
  problem: '문제 있음',
  all: '전체',
  paused: '일시정지',
};

// ============================================================================
// CP-026: 보드 빈 상태 문구
// ============================================================================

export const BOARD_EMPTY_TEXT: Record<BoardTab, string> = {
  problem: '현재 문제 숙소가 없습니다',
  all: '등록된 숙소가 없습니다',
  paused: '일시정지된 숙소가 없습니다',
};

// ============================================================================
// CP-027: 이벤트 빈 상태 문구
// ============================================================================

export const EVENTS_EMPTY_TEXT = '최근 이벤트가 없습니다';

// ============================================================================
// CP-028: 상태 배지 텍스트
// ============================================================================

export const STATUS_BADGE_TEXT: Record<StatusType, string> = {
  AVAILABLE: '예약 가능',
  UNAVAILABLE: '예약 불가',
  ERROR: '오류',
  UNKNOWN: '확인 중',
  PAUSED: '일시정지',
};

// ============================================================================
// DS-011: 상태 배지 컬러 (Tailwind 클래스)
// ============================================================================

export const STATUS_BADGE_STYLES: Record<StatusType, string> = {
  AVAILABLE: 'bg-chart-3/10 text-chart-3',
  UNAVAILABLE: 'bg-secondary text-secondary-foreground',
  ERROR: 'bg-destructive/10 text-destructive',
  UNKNOWN: 'bg-secondary text-muted-foreground',
  PAUSED: 'bg-secondary text-secondary-foreground',
};

// ============================================================================
// DS-011: Action 카드 컬러 (Tailwind 클래스)
// ============================================================================

export const ACTION_CARD_STYLES: Record<ActionCardColorScheme, string> = {
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
  warning: 'bg-chart-1/10 text-foreground border-chart-1/20',
  info: 'bg-secondary text-secondary-foreground border-border',
};

export const ACTION_CARD_ACCENT: Record<ActionCardColorScheme, string> = {
  critical: 'border-l-destructive',
  warning: 'border-l-chart-1',
  info: 'border-l-border',
};

// ============================================================================
// 상태 도트 컬러 (Accommodation Row, Event Timeline)
// ============================================================================

export const STATUS_DOT_STYLES: Record<StatusType, string> = {
  AVAILABLE: 'bg-chart-3',
  UNAVAILABLE: 'bg-muted-foreground',
  ERROR: 'bg-destructive',
  UNKNOWN: 'bg-chart-1',
  PAUSED: 'bg-muted-foreground',
};

// ============================================================================
// FR-012: 한도 데이터 없을 때
// ============================================================================

export const QUOTA_NULL_VALUE = '--';
export const QUOTA_NULL_DESCRIPTION = '데이터 확인 중';

// ============================================================================
// FR-040, FR-041: 이벤트 노출 수
// ============================================================================

export const EVENTS_INITIAL_COUNT = 5;
export const EVENTS_INCREMENT = 5;

// ============================================================================
// FR-022: Action 카드 최대 노출 수
// ============================================================================

export const ACTION_CARDS_MAX = 3;

# 대시보드 Action Center 재구성 구현 명세서 (LLM 직접 구현용)

문서 목적: 다른 LLM이 추가 해석 없이 바로 구현 가능한 수준으로 `/dashboard` 디자인/기능 요구사항을 고정한다.  
대상 사용자: 일반 유저  
1순위 목표: 대시보드 진입 후 5초 내 다음 행동 1개 인지

## 1. Scope / Non-scope

- SP-001 범위는 로그인 사용자용 `/dashboard` 단일 화면으로 고정한다.
- SP-002 화면 구조는 `KPI Strip`, `Action Center`, `숙소 운영 보드`, `최근 이벤트` 4개 섹션으로 고정한다.
- SP-003 기술 스택은 `Next.js + Tailwind CSS v4 + shadcn/ui`로 고정한다.
- SP-004 디자인 토큰은 `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary-foreground`, `bg-secondary`, `text-secondary-foreground`, `bg-destructive/10`, `text-destructive`, `bg-chart-1/10`, `bg-chart-3/10`만 사용한다.
- SP-005 구현 문서는 코드 예시를 포함하지 않는다.
- SP-006 구현 문서는 파일 경로 지시를 포함하지 않는다.
- SP-007 문구/조건/우선순위/수치는 본 문서 값만 사용한다.
- NS-001 관리자 화면 개편은 제외한다.
- NS-002 DB 스키마 변경은 제외한다.
- NS-003 신규 API 엔드포인트 추가는 제외한다.
- NS-004 결제 정책 자체 변경은 제외한다.

## 2. Terms

- TM-001 `문제 숙소`: `lastStatus`가 `ERROR` 또는 `UNKNOWN`.
- TM-002 `일시정지 숙소`: `isActive = false`.
- TM-003 `한도 임박`: `quotaRatio >= 0.8` 그리고 `< 1.0`.
- TM-004 `한도 도달`: `quotaRatio >= 1.0`.
- TM-005 `최근 오류 발생`: 최근 이벤트 중 `status = ERROR`가 1건 이상.
- TM-006 `정상 상태`: 문제 숙소 0건, 최근 오류 0건, 일시정지 숙소 0건.

## 3. Data Inputs & Formula

- DF-001 입력 데이터는 `accommodations[]`, `recentEvents[]`, `usage`, `quotas`, `hasKakaoToken` 5개로 고정한다.
- DF-002 `totalCount = accommodations.length`.
- DF-003 `activeCount = accommodations.filter(isActive=true).length`.
- DF-004 `pausedCount = accommodations.filter(isActive=false).length`.
- DF-005 `problemCount = accommodations.filter(lastStatus in [ERROR, UNKNOWN]).length`.
- DF-006 `availableCount = accommodations.filter(lastStatus=AVAILABLE).length`.
- DF-007 `quotaRatio = usage.accommodations / quotas.maxAccommodations`.
- DF-008 `quotas.maxAccommodations <= 0` 또는 null이면 `quotaRatio = null`.
- DF-009 `quotaPercent = quotaRatio === null ? null : floor(quotaRatio * 100)`.
- DF-010 `hasRecentError = recentEvents.some(status=ERROR)`.
- DF-011 정렬 심각도 점수는 `ERROR=3`, `UNKNOWN=2`, `UNAVAILABLE=1`, `AVAILABLE=0`으로 고정한다.

## 4. Functional Requirements (FR-*)

- FR-001 섹션 렌더 순서는 `KPI Strip -> Action Center -> 숙소 운영 보드 -> 최근 이벤트`로 고정한다.
- FR-002 각 섹션은 독립 실패 허용으로 처리한다.
- FR-003 숙소 목록 로딩 중에는 KPI와 보드만 스켈레톤으로 렌더한다.
- FR-004 숙소 목록 실패 시 보드 섹션만 오류 카드로 대체한다.
- FR-005 숙소 목록 성공 + 0건이면 전체 빈 상태를 렌더한다.

- FR-010 KPI 항목은 `전체 숙소`, `활성 숙소`, `문제 숙소`, `한도 사용률` 4개를 항상 노출한다.
- FR-011 한도 상태 색상 규칙은 `>=100% Critical`, `>=80% and <100% Warning`, `<80% Normal`로 고정한다.
- FR-012 한도 계산 불가 시 값은 `--`, 보조문구는 `데이터 확인 중`으로 고정한다.
- FR-013 숫자 표기는 천 단위 콤마를 고정 적용한다.

- FR-020 Action 카드 타입은 `QUOTA_REACHED`, `QUOTA_NEAR_LIMIT`, `NOTIFICATION_NOT_CONNECTED`, `RECENT_ERROR_DETECTED`, `PAUSED_ACCOMMODATIONS_EXIST` 5개로 제한한다.
- FR-021 우선순위는 `QUOTA_REACHED=100`, `RECENT_ERROR_DETECTED=90`, `NOTIFICATION_NOT_CONNECTED=80`, `QUOTA_NEAR_LIMIT=70`, `PAUSED_ACCOMMODATIONS_EXIST=60`으로 고정한다.
- FR-022 Action 카드 최대 노출 수는 3개로 고정한다.
- FR-023 `QUOTA_REACHED` 노출 시 `QUOTA_NEAR_LIMIT`은 생성 금지한다.
- FR-024 동일 타입 카드 중복 생성은 금지한다.
- FR-025 노출 카드가 0개면 안정 상태 카드 1개를 노출한다.
- FR-026 카드 정렬은 우선순위 내림차순, 동일 우선순위는 타입 정의 순서로 고정한다.
- FR-027 CTA 목적지는 `플랜 확인하기`, `카카오 연동하기`, `문제 숙소 보기`, `일시정지 숙소 보기`로 고정한다.

- FR-030 보드 탭은 `문제 있음`, `전체`, `일시정지` 3개로 고정한다.
- FR-031 기본 활성 탭은 `problemCount > 0`이면 `문제 있음`, 아니면 `전체`로 고정한다.
- FR-032 탭 필터는 `문제 있음=ERROR/UNKNOWN`, `전체=all`, `일시정지=isActive=false`로 고정한다.
- FR-033 보드 기본 정렬은 `심각도 내림차순` 후 `마지막 체크 시각 내림차순`으로 고정한다.
- FR-034 숙소 행 정보는 `숙소명`, `플랫폼`, `체크인~체크아웃`, `상태 배지`, `마지막 체크 시각`, `상세보기`, `수정`으로 고정한다.
- FR-035 탭 빈 상태 문구는 각각 1개만 사용한다.

- FR-040 최근 이벤트 기본 노출 수는 5개로 고정한다.
- FR-041 `더보기` 클릭 시 5개씩 추가 노출한다.
- FR-042 이벤트 행 순서는 `상태 배지 -> 숙소명 -> 가격(선택) -> 생성 시각 -> 알림 전송 여부`로 고정한다.
- FR-043 이벤트가 0건이면 빈 상태 문구를 노출한다.
- FR-044 최근 이벤트 요청 실패 시 이벤트 섹션만 오류 카드로 대체한다.

- FR-050 모든 버튼은 키보드 포커스로 접근 가능해야 한다.
- FR-051 상태 의미는 색상 + 텍스트를 동시에 제공해야 한다.
- FR-052 모바일 주요 CTA 최소 터치 높이는 44px로 고정한다.
- FR-053 390px 폭 기준 가로 스크롤은 0으로 고정한다.
- FR-054 텍스트 대비는 WCAG AA 4.5:1 이상으로 고정한다.

## 5. Design Spec (DS-*)

### DS-A. 시안 A (Action-First Grid)

- DS-001 브레이크포인트는 Mobile `<=767px`, Tablet `768~1023px`, Desktop `>=1024px`로 고정한다.
- DS-002 레이아웃 열 수는 Desktop `KPI 4열 + Action 3열`, Tablet `KPI 2열 + Action 최대 2열`, Mobile `모든 섹션 1열`로 고정한다.
- DS-003 높이는 `KPI min-h 104`, `Action min-h 140`, `보드 행 min-h 72`, `이벤트 행 min-h 56`으로 고정한다.
- DS-004 간격은 섹션 간 `24`, 카드 간 `12`, 카드 내부 `16`, 라벨-값 간 `8`로 고정한다.
- DS-005 타이포-페이지 타이틀은 Mobile `text-2xl/600/1.2`, Tablet `text-3xl/600/1.2`, Desktop `text-3xl/600/1.2`로 고정한다.
- DS-006 타이포-섹션 타이틀은 Mobile `text-lg/600/1.3`, Tablet `text-xl/600/1.3`, Desktop `text-xl/600/1.3`로 고정한다.
- DS-007 타이포-카드 타이틀은 Mobile `text-sm/500/1.4`, Tablet `text-base/500/1.4`, Desktop `text-base/500/1.4`로 고정한다.
- DS-008 타이포-본문은 Mobile `text-sm/400/1.5`, Tablet `text-sm/400/1.5`, Desktop `text-sm/400/1.5`로 고정한다.
- DS-009 타이포-메타는 Mobile `text-xs/400/1.4`, Tablet `text-xs/400/1.4`, Desktop `text-xs/400/1.4`로 고정한다.
- DS-010 타이포-KPI 숫자는 Mobile `text-2xl/600/1.2`, Tablet `text-3xl/600/1.2`, Desktop `text-3xl/600/1.2`로 고정한다.
- DS-011 컬러 토큰은 기본 카드 `bg-card + text-foreground + border-border`, Critical `bg-destructive/10 + text-destructive`, Warning `bg-chart-1/10 + text-foreground`, Success `bg-chart-3/10 + text-foreground`, Info `bg-secondary + text-secondary-foreground`로 고정한다.
- DS-012 라이트 HEX는 `Background #f8fbff`, `Card #ffffff`, `Foreground #1a2a40`, `Muted #5e6f86`, `Border #d6e0ec`, `Primary #f4b400`, `Destructive #e86a5d`, `Success #2fbf71`로 고정한다.
- DS-013 다크 HEX는 `Background #071326`, `Card #16263d`, `Foreground #eaf1f8`, `Muted #9fb1c7`, `Border #25364f`, `Primary #f4b400`, `Destructive #e86a5d`, `Success #2fbf71`로 고정한다.
- DS-014 로딩 상태는 실제 컴포넌트와 동일 높이 스켈레톤으로 고정한다.
- DS-015 오류 상태는 섹션 단위 대체 렌더로 고정한다.
- DS-016 빈 상태는 섹션 중앙 정렬 카드 1개로 고정한다.
- DS-017 disabled 상태는 `opacity-50` + `pointer-events-none`로 고정한다.
- DS-018 focus 상태는 `ring 2px`, `ring-ring/50`, `offset 2px`로 고정한다.
- DS-019 hover 트랜지션은 `140ms ease-out`, 등장 애니메이션은 `200ms ease-out`, 이동량 `8px`로 고정한다.

### DS-B. 시안 B (Split Command)

- DS-020 레이아웃은 Desktop `12컬럼(좌 4 / 우 8)`, Tablet `8컬럼(좌 3 / 우 5)`, Mobile `1열`로 고정한다.
- DS-021 높이는 `Action min-h 160`, `보드 행 min-h 72`, `이벤트 행 min-h 60`으로 고정한다.
- DS-022 간격은 섹션 간 `24`, 카드 간 `16`, 카드 내부 `16`으로 고정한다.
- DS-023 타이포-페이지 타이틀은 Mobile `text-2xl/700/1.25`, Tablet `text-3xl/700/1.25`, Desktop `text-3xl/700/1.25`로 고정한다.
- DS-024 타이포-섹션 타이틀은 Mobile `text-base/600/1.3`, Tablet `text-lg/600/1.3`, Desktop `text-lg/600/1.3`로 고정한다.
- DS-025 타이포-카드 타이틀은 Mobile `text-sm/600/1.4`, Tablet `text-base/600/1.4`, Desktop `text-base/600/1.4`로 고정한다.
- DS-026 타이포-본문은 전 구간 `text-sm/400/1.55`로 고정한다.
- DS-027 타이포-KPI 숫자는 Mobile `text-2xl/700/1.2`, Tablet `text-3xl/700/1.2`, Desktop `text-3xl/700/1.2`로 고정한다.
- DS-028 컬러는 Action 영역 `bg-secondary`, 보드/이벤트 영역 `bg-card`, 상태 컬러 매핑은 시안 A와 동일 고정한다.
- DS-029 상태 규칙은 로딩/오류/빈/disabled/focus 모두 시안 A와 동일 고정한다.
- DS-030 hover 트랜지션은 `120ms ease-in-out`, 등장 애니메이션은 `180ms ease-out`, 이동량 `6px`로 고정한다.

### DS-C. 시안 C (Timeline First)

- DS-031 레이아웃은 Desktop `KPI 4열 -> 이벤트 2열 -> Action 1열 -> 보드 1열`, Tablet `KPI 2열 -> 이벤트 1열 -> Action 1열 -> 보드 1열`, Mobile `1열 순차`로 고정한다.
- DS-032 높이는 `Action min-h 132`, `보드 행 min-h 72`, `이벤트 행 min-h 64`로 고정한다.
- DS-033 간격은 섹션 간 `20`, 카드 간 `12`, 카드 내부 `16`으로 고정한다.
- DS-034 타이포-페이지 타이틀은 Mobile `text-2xl/600/1.2`, Tablet `text-3xl/600/1.2`, Desktop `text-3xl/600/1.2`로 고정한다.
- DS-035 타이포-섹션 타이틀은 Mobile `text-base/600/1.35`, Tablet `text-lg/600/1.35`, Desktop `text-lg/600/1.35`로 고정한다.
- DS-036 타이포-카드 타이틀은 Mobile `text-sm/500/1.4`, Tablet `text-base/500/1.4`, Desktop `text-base/500/1.4`로 고정한다.
- DS-037 타이포-본문은 전 구간 `text-sm/400/1.5`, KPI 숫자는 Mobile `text-2xl`, Tablet/Desktop `text-3xl`로 고정한다.
- DS-038 컬러는 전체 카드 `bg-card`, 이벤트 상태 배지는 시안 A 대비 채도 +10%로 고정한다.
- DS-039 상태 규칙은 로딩/오류/빈/disabled/focus 모두 시안 A와 동일 고정한다.
- DS-040 hover 트랜지션은 `160ms ease-out`, 등장 애니메이션은 `220ms ease-out`, 이동량 `6px`로 고정한다.

### DS-비교 점수표 및 추천

- DS-041 점수 기준은 `가독성`, `구현난이도`, `접근성`, `확장성` 4개로 고정한다.
- DS-042 각 항목 점수 범위는 1~10점, 총점 40점 만점으로 고정한다.
- DS-043 시안 A 점수는 `가독성 9`, `구현난이도 9`, `접근성 9`, `확장성 8`, `총점 35`로 고정한다.
- DS-044 시안 B 점수는 `가독성 8`, `구현난이도 7`, `접근성 8`, `확장성 9`, `총점 32`로 고정한다.
- DS-045 시안 C 점수는 `가독성 7`, `구현난이도 6`, `접근성 8`, `확장성 7`, `총점 28`로 고정한다.
- DS-046 추천안은 시안 A로 고정한다.
- DS-047 최종 구현은 시안 A 수치만 사용하고 시안 혼합은 금지한다.

## 6. Interaction Spec (IS-*)

- IS-001 초기 데이터 요청은 4개 소스 병렬 실행으로 고정한다.
- IS-002 로딩 중 레이아웃 이동은 0으로 고정한다.
- IS-003 hover는 배경/보더/그림자만 변화, 위치 이동 0px으로 고정한다.
- IS-004 클릭 press 상태에서 scale 애니메이션은 금지한다.
- IS-005 focus 표시 우선순위는 기본 테두리보다 focus ring이 항상 상위로 고정한다.
- IS-006 `prefers-reduced-motion` 환경에서 모든 animation/transition은 0ms로 고정한다.
- IS-007 Action CTA 클릭 시 목적 액션 실행 후 추적 이벤트를 즉시 전송한다.
- IS-008 `문제 숙소 보기` 클릭 시 보드 탭을 `문제 있음`으로 변경한다.
- IS-009 `일시정지 숙소 보기` 클릭 시 보드 탭을 `일시정지`로 변경한다.
- IS-010 탭 전환은 재요청 없이 클라이언트 필터/정렬만 수행한다.
- IS-011 이벤트 `더보기` 클릭 시 현재 노출 수에 +5를 누적한다.
- IS-012 오류 카드 `다시 시도`는 해당 섹션만 재요청한다.
- IS-013 카드 등장 순서는 상단 섹션부터 하단 섹션 순차 재생으로 고정한다.
- IS-014 모바일에서 CTA는 너비 100%, 높이 44px 이상으로 고정한다.
- IS-015 키보드 포커스 이동 순서는 상->하, 좌->우로 고정한다.

## 7. Copy Spec (CP-*)

- CP-001 페이지 타이틀은 `대시보드`로 고정한다.
- CP-002 페이지 서브타이틀은 `지금 처리할 항목을 먼저 확인하세요`로 고정한다.
- CP-003 KPI 라벨은 `전체 숙소`, `활성 숙소`, `문제 숙소`, `한도 사용률`로 고정한다.
- CP-004 공통 오류 제목은 `데이터를 불러오지 못했습니다`로 고정한다.
- CP-005 공통 오류 설명은 `네트워크 상태를 확인하고 다시 시도해주세요`로 고정한다.
- CP-006 공통 오류 버튼은 `다시 시도`로 고정한다.
- CP-007 Action 빈 상태 제목은 `즉시 처리할 항목이 없습니다`로 고정한다.
- CP-008 Action 빈 상태 설명은 `현재 모니터링 상태가 안정적입니다.`로 고정한다.

- CP-010 `QUOTA_REACHED` 제목은 `숙소 한도에 도달했습니다`로 고정한다.
- CP-011 `QUOTA_REACHED` 설명은 `새 숙소 등록이 제한됩니다. 불필요한 숙소를 정리하거나 플랜을 변경하세요.`로 고정한다.
- CP-012 `QUOTA_REACHED` CTA는 `플랜 확인하기`로 고정한다.

- CP-013 `QUOTA_NEAR_LIMIT` 제목은 `숙소 한도가 거의 찼습니다`로 고정한다.
- CP-014 `QUOTA_NEAR_LIMIT` 설명은 `현재 사용량이 80% 이상입니다. 곧 새 숙소 등록이 제한될 수 있습니다.`로 고정한다.
- CP-015 `QUOTA_NEAR_LIMIT` CTA는 `플랜 확인하기`로 고정한다.

- CP-016 `NOTIFICATION_NOT_CONNECTED` 제목은 `알림 채널이 연결되지 않았습니다`로 고정한다.
- CP-017 `NOTIFICATION_NOT_CONNECTED` 설명은 `빈방 발생 시 즉시 알림을 받으려면 카카오 연동이 필요합니다.`로 고정한다.
- CP-018 `NOTIFICATION_NOT_CONNECTED` CTA는 `카카오 연동하기`로 고정한다.

- CP-019 `RECENT_ERROR_DETECTED` 제목은 `최근 체크 오류가 감지되었습니다`로 고정한다.
- CP-020 `RECENT_ERROR_DETECTED` 설명은 `일부 숙소에서 상태 확인 실패가 발생했습니다. 문제 숙소를 먼저 점검하세요.`로 고정한다.
- CP-021 `RECENT_ERROR_DETECTED` CTA는 `문제 숙소 보기`로 고정한다.

- CP-022 `PAUSED_ACCOMMODATIONS_EXIST` 제목은 `일시정지된 숙소가 있습니다`로 고정한다.
- CP-023 `PAUSED_ACCOMMODATIONS_EXIST` 설명은 `모니터링이 중단된 숙소가 있어 알림을 받지 못할 수 있습니다.`로 고정한다.
- CP-024 `PAUSED_ACCOMMODATIONS_EXIST` CTA는 `일시정지 숙소 보기`로 고정한다.

- CP-025 보드 탭 라벨은 `문제 있음`, `전체`, `일시정지`로 고정한다.
- CP-026 보드 빈 상태 문구는 `현재 문제 숙소가 없습니다`, `등록된 숙소가 없습니다`, `일시정지된 숙소가 없습니다`로 고정한다.
- CP-027 이벤트 빈 상태 문구는 `최근 이벤트가 없습니다`로 고정한다.
- CP-028 상태 배지 문구는 `예약 가능`, `예약 불가`, `오류`, `확인 중`, `일시정지`로 고정한다.

## 8. Tracking Spec (TR-*)

- TR-001 이벤트 목록은 `dashboard_viewed`, `dashboard_action_card_impression`, `dashboard_action_card_clicked`, `dashboard_board_tab_changed`, `dashboard_retry_clicked`로 고정한다.
- TR-002 공통 필수 파라미터는 `user_id`, `screen=dashboard`, `timestamp(ISO-8601)`로 고정한다.
- TR-003 카드 이벤트 필수 파라미터는 `card_type`으로 고정한다.
- TR-004 탭 이벤트 필수 파라미터는 `tab_name`으로 고정한다.
- TR-005 `dashboard_viewed`는 최초 완전 렌더 시 1회 전송으로 고정한다.
- TR-006 카드 impression은 카드 타입별 세션당 1회로 고정한다.
- TR-007 impression 중복 제거 키는 `session_id + card_type`으로 고정한다.
- TR-008 카드 클릭은 CTA 클릭마다 즉시 1회 전송으로 고정한다.
- TR-009 탭 변경은 실제 값이 바뀐 경우에만 전송한다.
- TR-010 `retry` 이벤트는 오류 카드 버튼 클릭마다 전송한다.
- TR-011 트래킹 실패는 UI 동작 차단 없이 무시한다.
- TR-012 이벤트 전송 우선순위는 `clicked > retry > tab_changed > impression > viewed`로 고정한다.

## 9. Acceptance Criteria (AC-* Given/When/Then)

- AC-001  
Given 한도 도달, 최근 오류, 알림 미연동, 일시정지 숙소가 동시에 존재한다  
When 대시보드에 진입한다  
Then Action 카드 3개만 노출되고 순서는 `한도 도달 -> 최근 오류 -> 알림 미연동`이다.

- AC-002  
Given 한도 도달 상태다  
When Action 카드를 생성한다  
Then `한도 임박` 카드는 노출되지 않는다.

- AC-003  
Given 문제 숙소가 1개 이상이다  
When 대시보드에 진입한다  
Then 보드 기본 탭은 `문제 있음`이다.

- AC-004  
Given 최근 이벤트가 12개다  
When 최초 진입한다  
Then 5개만 노출된다.

- AC-005  
Given 최근 이벤트가 12개다  
When `더보기`를 1회 클릭한다  
Then 총 10개가 노출된다.

- AC-006  
Given 숙소 목록 성공, 최근 이벤트 실패 상태다  
When 대시보드를 렌더한다  
Then 보드는 정상 노출되고 최근 이벤트 섹션만 오류 카드가 표시된다.

- AC-007  
Given 한도 데이터가 null이다  
When KPI를 렌더한다  
Then 한도 값은 `--`, 보조문구는 `데이터 확인 중`, 한도 기반 Action 카드는 생성되지 않는다.

- AC-008  
Given Action 카드 조건이 0건이다  
When Action Center를 렌더한다  
Then 안정 상태 카드 1개만 노출된다.

- AC-009  
Given 화면 폭이 390px이다  
When 대시보드를 렌더한다  
Then 가로 스크롤은 0이고 주요 CTA 높이는 44px 이상이다.

- AC-010  
Given 키보드만 사용한다  
When Tab 키로 이동한다  
Then 모든 인터랙티브 요소에 포커스 링이 표시된다.

- AC-011  
Given `prefers-reduced-motion`이 활성화되어 있다  
When 화면이 렌더된다  
Then animation/transition은 0ms다.

- AC-012  
Given 섹션 오류 카드가 노출 중이다  
When `다시 시도`를 클릭한다  
Then 해당 섹션만 재요청한다.

## 10. Open Decisions

- OD-001 Action 카드 최대 노출 수 `2 vs 3`, 기본값은 `3`, 확정 마감은 릴리즈 7일 전 18:00.
- OD-002 이벤트 기본 노출 수 `5 vs 10`, 기본값은 `5`, 확정 마감은 릴리즈 7일 전 18:00.
- OD-003 모바일 CTA 위치 `상단 고정 vs 하단 스티키`, 기본값은 `상단 고정`, 확정 마감은 릴리즈 5일 전 18:00.
- OD-004 오류 카드 고객지원 링크 `미포함 vs 포함`, 기본값은 `미포함`, 확정 마감은 릴리즈 5일 전 18:00.
- OD-005 마감 내 미확정 항목은 기본값 자동 채택으로 고정한다.

## LLM 구현 체크리스트

- CHK-001 섹션 순서가 `KPI -> Action -> 보드 -> 이벤트`로 구현되었는가.
- CHK-002 KPI 4개가 항상 노출되는가.
- CHK-003 한도 퍼센트가 `floor`로 계산되는가.
- CHK-004 한도 null 시 `--`와 `데이터 확인 중`이 노출되는가.
- CHK-005 Action 카드 타입 제한 5개를 지키는가.
- CHK-006 카드 우선순위와 정렬 규칙을 정확히 적용했는가.
- CHK-007 `QUOTA_REACHED`와 `QUOTA_NEAR_LIMIT` 중복 금지를 지키는가.
- CHK-008 Action 카드 최대 3개 제한을 지키는가.
- CHK-009 카드 0건일 때 안정 상태 카드 1개를 노출하는가.
- CHK-010 보드 탭 3개와 기본 탭 선택 규칙을 지키는가.
- CHK-011 보드 정렬 `심각도 -> 최신시각` 순서를 지키는가.
- CHK-012 이벤트 기본 5개, 더보기 +5 규칙을 지키는가.
- CHK-013 섹션 단위 부분 실패 처리를 지키는가.
- CHK-014 스켈레톤 높이가 실컴포넌트와 일치하는가.
- CHK-015 반응형 타이포 수치가 Mobile/Tablet/Desktop에 맞게 적용되었는가.
- CHK-016 390px에서 가로 스크롤이 없는가.
- CHK-017 모바일 주요 CTA 높이 44px 이상을 지키는가.
- CHK-018 focus ring 2px(`ring-ring/50`)이 모든 인터랙티브 요소에 적용되는가.
- CHK-019 문구가 CP 항목과 문자 단위로 일치하는가.
- CHK-020 트래킹 이벤트/파라미터/중복 방지 규칙이 TR 항목과 일치하는가.

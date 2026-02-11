# 구글폼 운영형 MVP 백로그 (조건 충족/열림 확인 과금 모델)

> 작성일: 2026-02-11  
> 목적: 웹사이트 없이 구글폼만으로 운영하는 현재 구조에서, 분쟁 없이 반복 가능한 운영 시스템을 만든다.
> 운영 정책/상품 기준: `docs/guides/google-form-service-operations.md`

## 0. 제품 원칙 (고정)

- 서비스 핵심: 사용자가 직접 계속 확인하기 어려운 조건을 대신 확인하고, **조건 충족(열림 확인)** 시 알림 제공
- 비핵심(금지): 예약 완료/결제 완료 보장 또는 대행
- 과금 기준: **조건 충족(열림 확인) 시점에만 비용 발생**
- 동일 요청(Case) 기준으로 조건 충족(열림 확인)은 **1회만 유효**하며, 최초 충족 시점에만 알림/과금 이벤트 발생
- 판단 기준: **Q4 원문 그대로** (Q4에 없는 조건은 적용 금지)
- Q1~Q7 표기는 현재 Google Form 템플릿 별칭이며, 시스템 파싱 기준은 질문 의미키(semantic key)임
- 운영 제약: **결제 전 시작 금지**
- 요청 접수 및 결제 이후 조건(Q4) 변경은 허용하지 않으며, 변경 필요 시 기존 요청 종료 후 새 요청으로 재접수
- 운영자는 Q4에 명시되지 않은 조건을 추정/보완/선의로 해석하여 적용하지 않음
- 용어 제약: `성공`, `성공 시 비용` 금지

---

## 1. 이번 스프린트 목표 (72시간)

- 유료 검증 지표 3개를 같은 화면에서 확인 가능
  - 광고 클릭 수
  - 폼 제출 수
  - 실제 결제 수
- 폼 접수 건 1건 이상에서 아래 흐름이 시스템으로 추적 가능
  - 접수 → 결제 확인 → 확인 시작 → 조건 충족(열림 확인) → 비용 발생 기록
- 분쟁 대응용 증거 4종 자동 저장
  - Q4 원문 스냅샷
  - Q7 동의 스냅샷
  - 조건 충족 시점 증거(시각/상태/스크린샷)
  - 운영자 액션 로그

---

## 2. 백로그 (P0: 지금 바로 구현)

## P0-1. 구글폼 접수 Webhook + 원문 스냅샷 고정 ✅ 완료 (2026-02-11)

- 목표: 폼 제출 내용을 수정 불가능한 증거로 저장
- 구현
  - `POST /api/intake/google-form` 엔드포인트 추가
  - `responseId` 기준 멱등 처리(중복 수신 방지)
  - Q4/Q7/연락처/기간/대상을 `rawPayload` JSON으로 원문 저장
  - 서명 검증(공유 시크릿 헤더 `x-webhook-secret`) 추가
- 완료조건(DoD)
  - 동일 `responseId` 재전송 시 데이터 1건만 유지
  - Q4/Q7 원문을 관리자 API(`GET /api/admin/submissions`, `GET /api/admin/submissions/:id`)에서 조회 가능
  - 수동 삭제 외에는 원문 수정 불가
- 구현 위치
  - `packages/db/prisma/schema.prisma` — `FormSubmission` 모델 + `FormSubmissionStatus` enum
  - `apps/web/src/app/api/intake/google-form/route.ts` — webhook 엔드포인트
  - `apps/web/src/services/intake.service.ts` — 멱등 생성/조회 서비스
  - `apps/web/src/app/api/admin/submissions/route.ts` — 관리자 목록 API
  - `apps/web/src/app/api/admin/submissions/[id]/route.ts` — 관리자 상세 API
  - `apps/web/src/services/intake.service.test.ts` — 단위 테스트 (10개 통과)

## P0-1A. Q1~Q7 입력 스키마 고정 + 무효 요청 차단 ✅ 완료 (2026-02-11)

- 목표: 폼 질문별 역할(Q1~Q7 별칭/의미키)을 데이터 스키마로 강제해 운영 흔들림 제거
- 구현
  - Zod 기반 `rawPayloadFieldsSchema` 정의 (8개 의미키: `contact_channel`, `contact_value`, `target_url`, `condition_definition`, `request_window`, `check_frequency`, `billing_consent`, `scope_consent`)
  - 필수 검증:
    - `target_url` URL 형식 유효성
    - `condition_definition` 최소 10자 (모호 표현 감지는 P0-3에서)
    - `request_window` 유효한 미래 날짜 (폼에 종료일만 있으므로 종료일만 검증)
    - `billing_consent`/`scope_consent` 모두 `true`
  - 무효 요청은 `REJECTED` 상태 + `rejectionReason`에 모든 사유를 세미콜론 구분으로 저장
  - 유효 요청은 `extractedFields`에 정규화된 의미키 필드 저장
- 완료조건(DoD)
  - 폼 원문(`rawPayload`)과 정규화된 의미키 필드(`extractedFields`)가 함께 저장됨
  - 무효 요청은 `REJECTED` 상태로 분리 (P0-2 케이스 생성 시 차단 기반)
  - 관리자 API(`GET /api/admin/submissions/:id`)에서 `rejectionReason` 즉시 확인 가능
- 구현 위치
  - `apps/web/src/services/intake.service.ts` — `rawPayloadFieldsSchema` + `validateAndExtractFields` 추가
  - `apps/web/src/services/intake.service.test.ts` — 검증 테스트 8건 추가 (총 18개)

## P0-1B. 폼 버전/질문 매핑 레지스트리 도입 ⏭️ 건너뜀 (2026-02-11)

- 사유: Apps Script에서 질문 고유 ID 기반으로 매핑 후 semantic key로 전송하는 구조로 구현 완료. 서버 측 매핑 레지스트리가 불필요해짐.
- `formVersion` 필드는 스키마에 이미 존재하므로, 향후 필요 시 Apps Script에서 추가 전송하면 됨.

## P0-2. 운영 상태 머신(케이스 파이프라인) 도입 ✅ 완료 (2026-02-11)

- 목표: "지금 어느 단계인지"를 말싸움 없이 상태값으로 관리
- 상태 전이 규칙
  - `RECEIVED` → `REVIEWING` → `WAITING_PAYMENT` → `ACTIVE_MONITORING` → `CONDITION_MET` → `BILLED` → `CLOSED`
  - 예외 분기: `REVIEWING` → `REJECTED`, `WAITING_PAYMENT` → `CANCELLED`, `ACTIVE_MONITORING` → `EXPIRED`/`CANCELLED`
  - 터미널 상태: `REJECTED`, `EXPIRED`, `CANCELLED`, `CLOSED` (전이 불가)
- 완료조건(DoD)
  - 상태 변경 시 `who/when/why` 감사 로그(`CaseStatusLog`) 저장
  - 허용되지 않은 상태 전이 차단(예: 결제 전 `ACTIVE_MONITORING` 금지)
  - 유효한 `FormSubmission`에서만 케이스 생성 가능 (REJECTED/PROCESSED 차단)
- 구현 위치
  - `packages/db/prisma/schema.prisma` — `CaseStatus` enum, `Case` 모델, `CaseStatusLog` 모델, `FormSubmission` 역방향 relation
  - `apps/web/src/services/cases.service.ts` — 케이스 생성/전이/조회 서비스 (transaction 기반)
  - `apps/web/src/services/cases.service.test.ts` — 단위 테스트 (24개 통과)
  - `apps/web/src/app/api/admin/cases/route.ts` — 목록(GET) + 생성(POST) API
  - `apps/web/src/app/api/admin/cases/[id]/route.ts` — 상세 조회 API
  - `apps/web/src/app/api/admin/cases/[id]/status/route.ts` — 상태 전이 API (PATCH)

## P0-3. Q4 모호성 감지 + 시작 전 명확화 큐 ✅ 완료 (2026-02-11)

- 목표: 애매한 요청을 시작 전에 정리해 분쟁 선제 차단
- 구현
  - Q4(`condition_definition`) 텍스트에서 인원/가격 조건/트리거 문구 필수 슬롯을 규칙 기반으로 검사
  - 모호 표현 사전(`적당한`, `괜찮은`, `저렴한`, `좋은 가격`, `가능하면`, `빨리`) 기반 감지
  - `GREEN`/`AMBER`/`RED` 3단계 판정: GREEN(명확), AMBER(일부 누락 또는 모호), RED(트리거 자체 불명확)
  - `CaseStatus` enum에 `NEEDS_CLARIFICATION` 정식 추가 (REVIEWING ↔ NEEDS_CLARIFICATION 양방향 전이)
  - `Case` 모델에 `ambiguityResult`(JSON), `clarificationResolvedAt`(DateTime?) 필드 추가
  - 가드: AMBER/RED이고 `clarificationResolvedAt` 미설정 시 `REVIEWING → WAITING_PAYMENT` 전이 차단
  - 명확화 해결(`NEEDS_CLARIFICATION → REVIEWING` 전이) 시 `clarificationResolvedAt` 자동 설정
  - 관리자 UI: 케이스 목록/상세 페이지, 모호성 분석 패널, 상태 전이 다이얼로그
  - 운영자용 명확화 요청 템플릿 1클릭 복사 기능
- 완료조건(DoD)
  - 모호성 AMBER/RED 케이스는 명확화 해결 전 `WAITING_PAYMENT` 전이 차단
  - 명확화 답변 반영(NEEDS_CLARIFICATION → REVIEWING) 후에만 다음 단계 진행 가능
  - 관리자 UI에서 모호성 분석 결과(severity, 누락 슬롯, 모호 표현) 즉시 확인 가능
- 구현 위치
  - `packages/db/prisma/schema.prisma` — `NEEDS_CLARIFICATION` 상태, `ambiguityResult`/`clarificationResolvedAt` 필드
  - `apps/web/src/services/condition-parser.service.ts` — 규칙 기반 모호성 감지 엔진
  - `apps/web/src/services/condition-parser.service.test.ts` — 13개 테스트
  - `apps/web/src/services/cases.service.ts` — 전이 규칙/가드/분석 통합 (30개 테스트)
  - `apps/web/src/lib/queryKeys.ts` — `cases`/`caseDetail` 키 추가
  - `apps/web/src/features/admin/cases/` — queries, mutations, index
  - `apps/web/src/app/admin/cases/page.tsx` — 케이스 목록 페이지
  - `apps/web/src/app/admin/cases/_components/caseManagement.tsx` — 목록 컴포넌트
  - `apps/web/src/app/admin/cases/[id]/page.tsx` — 케이스 상세 페이지
  - `apps/web/src/app/admin/cases/[id]/_components/caseDetailView.tsx` — 상세 컴포넌트
  - `apps/web/src/app/admin/cases/[id]/_components/clarificationPanel.tsx` — 모호성 패널
  - `apps/web/src/app/admin/cases/[id]/_components/statusTransitionDialog.tsx` — 상태 전이 다이얼로그

## P0-4. Q7 동의 2종 체크 증거화 ✅ 완료 (2026-02-11)

- 목표: "비용 발생 동의"와 "열림 여부만 확인" 동의를 계약 데이터로 고정
- 구현
  - `FormSubmission` 모델에 명시적 동의 컬럼 4개 추가: `consentBillingOnConditionMet`, `consentServiceScope`, `consentCapturedAt`, `consentTexts`
  - 폼 검증 성공 시 동의값(Boolean) + 캡처 시각 + 체크박스 원문(JSON)을 DB에 저장
  - 동의 체크박스 원문 상수 정의 (운영 가이드 Q7: "설명문보다 체크 문장 자체를 계약 근거로 취급")
  - 둘 다 true가 아니면 접수 무효(`REJECTED`) 처리 (P0-1A에서 구현, 유지)
  - 관리자 케이스 상세 페이지에 Q7 동의 증거 패널 추가
- 완료조건(DoD)
  - 관리자 상세에서 Q7 동의 스냅샷(동의 여부 + 체크박스 원문 + 캡처 시각 + 응답 ID) 즉시 조회 가능
  - 동의 누락 건은 자동 `REJECTED`
  - 동의값이 JSON(`extractedFields`)뿐 아니라 명시적 DB 컬럼으로도 저장
- 구현 위치
  - `packages/db/prisma/schema.prisma` — `FormSubmission`에 동의 4컬럼 추가
  - `apps/web/src/services/intake.service.ts` — `CONSENT_TEXTS` 상수, `validateAndExtractFields`에서 동의 저장, Output 타입 확장
  - `apps/web/src/services/intake.service.test.ts` — 동의 증거 테스트 3건 추가 (총 21개)
  - `apps/web/src/services/cases.service.ts` — `CASE_DETAIL_SELECT` submission에 동의 필드 추가
  - `apps/web/src/features/admin/cases/queries.ts` — `CaseDetail.submission` 타입 확장
  - `apps/web/src/app/admin/cases/[id]/_components/consentEvidencePanel.tsx` — Q7 동의 증거 패널
  - `apps/web/src/app/admin/cases/[id]/_components/caseDetailView.tsx` — 패널 통합

## P0-5. 결제 확인 전 시작 차단(하드 게이트) ✅ 완료 (2026-02-11)

- 목표: 운영 원칙 "결제 전 시작 금지"를 시스템으로 강제
- 구현
  - `Case` 모델에 `paymentConfirmedAt`(DateTime?), `paymentConfirmedBy`(String?) 필드 추가
  - `confirmPayment()` 서비스 함수: WAITING_PAYMENT 상태에서만 결제 확인 가능, 이미 확인된 경우 에러
  - 결제 확인 시 감사 로그(`CaseStatusLog`): `WAITING_PAYMENT → WAITING_PAYMENT` + reason 기록 (상태 변경 없이 이력 보존)
  - 결제 가드: `paymentConfirmedAt`가 null이면 `WAITING_PAYMENT → ACTIVE_MONITORING` 전이 차단
  - 관리자 UI: 결제 확인 버튼 (WAITING_PAYMENT + 미확인 시 표시), 확인 완료 상태 표시
  - 상태 전이 다이얼로그: 결제 미확인 시 "모니터링 시작" 옵션 비활성화 + 안내 메시지
- 완료조건(DoD)
  - 결제 미확인 케이스의 `ACTIVE_MONITORING` 전이 API 호출은 에러로 실패
  - 결제 확인 후에만 `ACTIVE_MONITORING` 전이 가능
  - 결제 확인 시점/확인자가 DB에 영구 저장
- 구현 위치
  - `packages/db/prisma/schema.prisma` — `Case`에 `paymentConfirmedAt`/`paymentConfirmedBy` 추가
  - `apps/web/src/services/cases.service.ts` — `confirmPayment()` + 결제 가드 + 타입/select 확장
  - `apps/web/src/services/cases.service.test.ts` — 결제 가드 + confirmPayment 테스트 6건 추가 (총 36개)
  - `apps/web/src/app/api/admin/cases/[id]/payment/route.ts` — 결제 확인 API (POST)
  - `apps/web/src/features/admin/cases/mutations.ts` — `useConfirmPaymentMutation` 추가
  - `apps/web/src/features/admin/cases/queries.ts` — `CaseItem` 타입에 결제 필드 추가
  - `apps/web/src/app/admin/cases/[id]/_components/paymentConfirmButton.tsx` — 결제 확인 버튼
  - `apps/web/src/app/admin/cases/[id]/_components/caseDetailView.tsx` — 결제 버튼 통합
  - `apps/web/src/app/admin/cases/[id]/_components/statusTransitionDialog.tsx` — 결제 미확인 시 비활성화

## P0-6. 조건 충족(열림 확인) 이벤트 증거 패킷

- 목표: “봤다/못 봤다” 논쟁을 증거 패킷으로 종결
- 구현
  - 조건 충족 시점에 이벤트 생성(`ConditionMetEvent`)
  - 필수 증거 저장: 체크 시각, 플랫폼, 체크 결과, 가격/옵션, 스크린샷 경로
  - 이벤트 멱등키(`caseId + checkLogId`)로 중복 과금 방지
- 완료조건(DoD)
  - 케이스당 동일 체크에 대한 이벤트 1건만 생성
  - 운영자 화면에서 증거 패킷 다운로드/복사 가능
- 구현 위치
  - `packages/db/prisma/schema.prisma`
  - `packages/worker-shared/src/runtime/notifications/**`
  - `apps/web/src/services/evidence.service.ts` (신규)

## P0-7. 알림 + 과금 이벤트 원자적 트리거

- 목표: 조건 충족 알림과 비용 발생 기록의 불일치 제거
- 구현
  - 단일 트랜잭션에서
    - `ConditionMetEvent` 생성
    - 고객 알림 발송 시도 기록
    - `BillingEvent` 생성
  - 실패 시 재시도 큐(최대 N회) + 중복 방지 키 사용
- 완료조건(DoD)
  - 동일 케이스에서 `BillingEvent` 중복 생성 0건
  - 알림 실패 시 수동 재시도 가능
- 구현 위치
  - `packages/worker-shared/src/runtime/notifications/**`
  - `apps/web/src/services/billing.service.ts` (신규)

## P0-8. 운영자 액션 로그 + 분쟁 대응 템플릿

- 목표: 이의제기 대응 문구를 표준화하고 기록을 남김
- 구현
  - 템플릿 3종 저장(접수/진행가능+비용/결제확인후시작)
  - 분쟁 대응 표준문장 3종 원클릭 삽입
  - 템플릿 발송 이력(누가, 언제, 어떤 채널) 저장
- 완료조건(DoD)
  - 케이스 타임라인에서 모든 고객 커뮤니케이션 추적 가능
  - 운영자별 템플릿 사용 로그 조회 가능
- 구현 위치
  - `apps/web/src/services/messages.service.ts` (신규)
  - `apps/web/src/app/admin/cases/_components/message-templates.tsx` (신규)

## P0-9. 운영 대시보드(구글폼 전용 퍼널)

- 목표: 지금 필요한 전환만 본다 (클릭/제출/결제)
- 구현
  - KPI 카드 3개: 클릭 수, 폼 제출 수, 결제 수
  - 단계별 전환율: 제출→결제, 결제→조건 충족
  - 기간 필터: 오늘/최근 7일/최근 30일
- 완료조건(DoD)
  - 구글 Ads/수기 입력/DB 지표를 한 화면에서 확인 가능
  - 72시간 실험 결과를 수치로 판단 가능
- 구현 위치
  - `apps/web/src/services/admin/funnel.service.ts` (신규)
  - `apps/web/src/app/admin/funnel/page.tsx` (신규)

## P0-10. 숫자형 가격 산식 엔진 + 견적 근거 기록

- 목표: 견적 산정의 일관성을 숫자로 고정하고 운영자 간 편차 제거
- 구현
  - 가격 입력 요소: `baseFee`, `durationWeight`, `difficultyWeight`, `urgencyWeight`, `frequencyWeight`
  - 계산 규칙: 1,000원 반올림 + 하한/상한 적용
  - 케이스별 가격 근거 스냅샷 저장(누가/언제/어떤 가중치)
- 완료조건(DoD)
  - 모든 결제 대기 건에서 산식 근거 조회 가능
  - 수기 계산 없이 동일 입력에 동일 가격 산출
  - 가격 변경 시 변경 이력 감사 로그 자동 저장
- 구현 위치
  - `packages/db/prisma/schema.prisma`
  - `apps/web/src/services/pricing.service.ts` (신규)
  - `apps/web/src/app/admin/cases/_components/pricing-breakdown.tsx` (신규)

---

## 3. 백로그 (P1: 2~4주)

## P1-1. 요청 기간 자동 만료/종료

- 목표: 요청 기간이 끝난 케이스를 자동 종료
- 완료조건(DoD)
  - Q5 종료 시점까지 미충족인 요청은 `EXPIRED`로 종료되고 비용 0원 처리
  - 만료 배치가 하루 1회 실행
  - 만료 안내 메시지 자동 발송

## P1-2. 알림 채널 이중화(카톡 실패 시 이메일)

- 목표: 알림 누락률 감소
- 완료조건(DoD)
  - 1차 실패 시 대체 채널 자동 시도
  - 케이스별 채널 도달률 집계

## P1-3. 가격표/기간 기반 견적 규칙 엔진

- 목표: 비용 안내를 운영자 감각이 아닌 규칙으로 통일
- 완료조건(DoD)
  - 플랫폼/기간/난이도별 기본 요금 규칙 저장 및 미리보기 지원

## P1-4. 운영 SLA 타이머

- 목표: 접수 후 응답 지연 방지
- 완료조건(DoD)
  - `RECEIVED` 후 30분 내 미응답 건 경고
  - `WAITING_PAYMENT` 장기 정체 건 자동 리마인드

## P1-5. Evidence Packet 자동 봉인 파이프라인

- 목표: 조건 충족 순간의 증거 패킷을 멱등/무결성 보장으로 자동 보존
- 완료조건(DoD)
  - 멱등 키(`caseId + firstConditionMetAt`) 기준 패킷 1건만 생성
  - `sealedAt` 이후 수정 불가
  - 스크린샷/발송 로그 일부 실패 시 `PARTIAL`로 봉인 + 재시도 큐 이관
- 구현 위치
  - `packages/db/prisma/schema.prisma`
  - `packages/worker-shared/src/runtime/notifications/**`
  - `apps/web/src/services/evidence.service.ts`

## P1-6. Q4 자동 검증 규칙 엔진 (LLM 보조)

- 목표: 모호한 요청을 접수 단계에서 자동 분류해 운영자 피로 감소
- 완료조건(DoD)
  - `GREEN/AMBER/RED` 판정과 누락 필드/모호 표현 리포트 제공
  - `AMBER/RED` 요청은 운영자 확인 전 상태 전이 불가
  - LLM 비가용 시에도 규칙 기반 최소 판정 동작
- 구현 위치
  - `apps/web/src/services/condition-parser.service.ts`
  - `apps/web/src/services/intake.service.ts`
  - `apps/web/src/app/admin/cases/_components/clarification-panel.tsx`

---

## 4. 백로그 (P2: 검증 후 확장)

## P2-1. 고객용 읽기 전용 상태 페이지(비로그인 링크)

- 목표: 고객 문의 감소 (현재 상태/주의문구/최근 알림 시각 확인)
- 주의: 예약 대행 오해를 막기 위해 문구 고정 필요

## P2-2. 분쟁 리스크 스코어링

- 목표: 분쟁 가능성 높은 요청을 사전에 식별
- 입력: Q4 모호성, 잦은 조건 변경, 답변 지연 등

## P2-3. 광고 소재-요청 품질 상관 분석

- 목표: 클릭이 아니라 “결제/조건 충족” 중심으로 광고 문구 최적화

---

## 5. 구현 순서 제안

1. `P0-1 ~ P0-5` 먼저 구현해 계약/결제/시작 게이트를 고정
2. `P0-6 ~ P0-8`으로 증거/과금/분쟁 대응 자동화
3. `P0-9 ~ P0-10`으로 대시보드/가격 산식을 운영 표준으로 고정
4. 결제와 조건 충족 데이터가 2주 누적되면 `P1` 착수

---

## 6. 하지 않을 것 (초기 단계)

- 웹사이트 전환 태그/고급 마케팅 자동화
- 예약 완료 추적/보장 기능
- 고객 셀프 결제 플로우 대형 구축
- 복잡한 AI 자동판단(초기에는 Q4 원문 우선)

## 7. 운영자 보호 규칙 (지속 운영용)

- 운영자가 피로/감정/개인 사정으로 판단 기준(Q4/Q7/상태 전이)을 변경하지 않음
- 운영이 어려운 시간대에는 신규 접수를 일시 중단할 수 있음

# Master Backlog 실행 티켓 분해 (Epic → Story → Ticket)

source: `docs/backlog/master-backlog-and-roadmap.md`  
원칙: 원문은 변경하지 않고, 1~2일 내 PR 1개로 머지 가능한 실행 티켓으로만 분해

진행현황 사용 규칙:
- Ticket는 `진행완료` 체크박스로 추적한다.
- Ticket의 `DoD`와 `Validation` 체크박스를 모두 완료한 뒤 `진행완료`를 체크한다.
- Story/Epic의 `Progress: 완료`는 하위 항목 완료 후 체크한다.

---

## Epic 1 — Phase 1 즉시 실행 (P0)
summary: P0-9/P0-10/핵심 기술부채(TD-1, TD-3)를 운영자가 바로 체감하는 단위로 배포한다.  
success_metric: Admin 퍼널 화면과 케이스 견적 화면이 실데이터로 동작하고, 30일 Baseline(7/6/2/1)이 재현된다.
- [ ] Progress: 완료

### Story 1.1 — [P0-9] 운영 퍼널 대시보드 1차 릴리즈
summary: 클릭 지표를 제외한 서버 SoT(제출/처리/결제확인/조건충족) 퍼널을 고정한다.  
success_metric: KPI 4개와 전환율 4개가 동일 쿼리 기준으로 UI/API/검증 스크립트에서 일치한다.
- [ ] Progress: 완료

P0-9 KPI SoT 고정 (문서/SQL/DoD 공통):

| KPI | Source of Truth (table.column) | 기준 시각 컬럼 | 중복 규칙 |
|---|---|---|---|
| 제출(접수) | `FormSubmission.responseId` | `FormSubmission.createdAt` | `count(distinct FormSubmission.responseId)` |
| 처리 | `FormSubmission.id` (`status='PROCESSED'`) | `FormSubmission.updatedAt` | `count(distinct FormSubmission.id)` |
| 결제 확인 | `Case.id` (`paymentConfirmedAt IS NOT NULL`) | `Case.paymentConfirmedAt` | `count(distinct Case.id)` |
| 조건 충족 | `BillingEvent.caseId` | `BillingEvent.createdAt` | `BillingEvent.caseId` unique + join 시 `count(distinct caseId)` |

SQL/문서/DoD 정합성 규칙:
- SQL alias는 `submitted/processed/paymentConfirmed/conditionMet`로 고정한다.
- DoD/Validation의 수치 검증은 위 alias와 동일 키로만 비교한다.

#### Ticket `P0-9-T1`
- [x] 진행완료
Title: P0-9 지표 정의서와 검증 SQL 고정
Goal: SoT/기준시각/중복규칙을 문서와 SQL 스크립트로 고정한다.
User-visible outcome: 운영자가 "지표가 왜 이 숫자인지"를 문서+쿼리로 즉시 확인할 수 있다.
Scope / Out of scope: Scope는 지표정의 표와 검증 SQL 추가, Out은 UI 개발.
Changes: DB(조회 쿼리), API(없음), UI(없음), 배치(없음), 로그(검증 실행 로그).
DoD:
- [x] `제출/처리/결제확인/조건충족` 정의가 문서에 고정된다.
- [x] 최근 30일 기준 스냅샷 SQL이 저장된다.
- [x] SQL 결과가 `7/6/2/1`로 재현된다.
- [x] 문서/SQL/DoD에 KPI 기준 시각 컬럼명이 동일하게 표기된다.
Validation:
- [x] `psql` 실행 결과 스크린샷/로그를 PR에 첨부한다.
- [x] SQL 결과와 문서 수치 일치 여부를 체크리스트로 남긴다.
Validation evidence: `docs/backlog/roadmap/validation/p0-9-t1-psql.log`
Dependencies/Blockers: 없음.
Estimate_days: 1

#### Ticket `P0-9-T2`
- [x] 진행완료
Title: 퍼널 집계 서비스/엔드포인트 구현
Goal: `admin/funnel` API를 통해 KPI/전환율/일별 추이를 반환한다.
User-visible outcome: 퍼널 화면 로딩 시 실시간 숫자가 API에서 내려온다.
Scope / Out of scope: Scope는 서비스+API+권한체크, Out은 차트 스타일링.
Changes: DB(집계 쿼리), API(`GET /api/admin/funnel`), UI(연동 훅), 로그(requestId/latency).
Scope lock:
- [x] `apps/web/src/services/admin/funnel.service.ts`
- [x] `apps/web/src/app/api/admin/funnel/route.ts`
- [x] `apps/web/src/app/admin/funnel/page.tsx`
- [x] `packages/db/sql/admin_funnel_snapshot_30d.sql`
- [x] `apps/web/src/services/admin/__tests__/funnel.service.test.ts`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "range": {
      "from": "2026-01-14T00:00:00Z",
      "to": "2026-02-13T23:59:59Z",
      "timezone": "UTC"
    },
    "kpis": {
      "submitted": 7,
      "processed": 6,
      "paymentConfirmed": 2,
      "conditionMet": 1
    },
    "conversion": {
      "submittedToProcessed": 0.857,
      "processedToPaymentConfirmed": 0.333,
      "paymentConfirmedToConditionMet": 0.5,
      "submittedToConditionMet": 0.143
    },
    "series": [
      {
        "date": "2026-02-13",
        "submitted": 1,
        "processed": 1,
        "paymentConfirmed": 0,
        "conditionMet": 0
      }
    ]
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 일 집계(UTC) 고정, 조건충족은 `count(distinct BillingEvent.caseId)` 고정.
DoD:
- [x] 기간 필터(today/7d/30d/all)가 API 파라미터로 동작한다.
- [x] 전환율 4개가 서버 계산값으로 반환된다.
- [x] `count(distinct caseId)` 규칙이 조건충족 집계에 적용된다.
- [x] API response의 KPI 키와 SQL alias가 1:1 대응된다.
Validation:
- [x] Vitest로 서비스 단위 테스트 6개 이상 작성.
- [x] API 응답과 직접 SQL 결과를 1회 이상 대조한다.
Validation evidence: `docs/backlog/roadmap/validation/p0-9-t2-api-sql-compare.log`
Dependencies/Blockers: `P0-9-T1`.
Estimate_days: 2

#### Ticket `P0-9-T3`
- [x] 진행완료
Title: Admin 퍼널 KPI 카드/전환율 UI 추가
Goal: 운영자가 필터 변경만으로 퍼널 병목을 즉시 확인하게 한다.
User-visible outcome: Admin 메뉴에 "퍼널"이 생기고 KPI 카드 4개와 전환율이 표시된다.
Scope / Out of scope: Scope는 카드/필터/메뉴, Out은 클릭 퍼널.
Changes: DB(없음), API(기존 funnel API 사용), UI(`admin/funnel` 페이지), 로그(필터변경 이벤트).
Scope lock:
- [x] `apps/web/src/app/admin/funnel/page.tsx`
- [x] `apps/web/src/app/admin/funnel/_components/kpi-cards.tsx`
- [x] `apps/web/src/app/admin/funnel/_components/conversion-matrix.tsx`
- [x] `apps/web/src/app/admin/funnel/_components/date-filter.tsx`
- [x] `apps/web/src/app/admin/funnel/_hooks/use-funnel-query.ts`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "kpis": {
      "submitted": 7,
      "processed": 6,
      "paymentConfirmed": 2,
      "conditionMet": 1
    },
    "uiMeta": {
      "targetVersion": "v1",
      "source": "server_sot"
    }
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. UI는 `kpis/conversion/series` 키만 사용한다.
DoD:
- [x] KPI 카드 4개(제출/처리/결제확인/조건충족) 표시.
- [x] 전환율 4개가 카드 하단에 표시.
- [x] 기간 필터 변경 시 1초 내 재조회.
Validation:
- [x] 재현 시나리오: 필터 전환 후 값 변경 확인.
- [x] 프론트 테스트 또는 스냅샷 테스트 3개 이상 작성.
Validation evidence: `docs/backlog/roadmap/validation/p0-9-t3-frontend-tests.log`
Dependencies/Blockers: `P0-9-T2`.
Estimate_days: 2

#### Ticket `P0-9-T4`
- [x] 진행완료
Title: UTC 필터 + KST 표시 정책 적용
Goal: 저장/필터 UTC, 표시 KST 원칙을 코드로 강제한다.
User-visible outcome: Admin 날짜/시간이 항상 KST로 일관되게 보인다.
Scope / Out of scope: Scope는 공용 포맷 유틸과 퍼널 페이지 적용, Out은 전체 Admin 일괄 교체.
Changes: DB(UTC 유지), API(UTC 경계 처리), UI(KST 포맷), 로그(타임존 디버그 로그).

Code apply points:
- `apps/web/src/lib/datetime/format-kst.ts` (표시 포맷 함수 단일 진입점)
- `apps/web/src/app/api/admin/funnel/route.ts` (`from/to` ISO UTC 필터 유지)
- `apps/web/src/app/admin/funnel/page.tsx` (KST 표시 함수만 사용)
- `apps/web/src/app/admin/funnel/_components/date-filter.tsx` (필터 전송은 UTC ISO)
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "filter": {
      "from": "2026-02-01T00:00:00Z",
      "to": "2026-02-14T00:00:00Z"
    },
    "displayTimezone": "Asia/Seoul"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 필터 파라미터는 ISO(UTC) 전송, 표시만 KST 포맷한다.
DoD:
- [x] `Intl.DateTimeFormat(... timeZone: 'Asia/Seoul')` 경로가 공용화된다.
- [x] 기간 경계(00:00) 테스트가 UTC/KST 케이스 포함.
- [x] 사용자 로컬 타임존 의존 코드가 퍼널 화면에서 제거된다.
- [x] 표시 포맷 함수 1개(`formatKstDateTime`)로 모든 Admin 표시를 통일한다.
- [x] `Intl.DateTimeFormat`에 `timeZone: 'Asia/Seoul'`이 강제된다.
- [x] 필터 파라미터는 ISO UTC 문자열로만 전송된다.
Validation:
- [x] UTC 경계 샘플 데이터로 전환 테스트 작성.
- [x] 수동 검증: 브라우저 타임존 변경 후에도 KST 고정 표시 확인.
Validation evidence: `docs/backlog/roadmap/validation/p0-9-t4-timezone.log`
Dependencies/Blockers: `P0-9-T2`, `P0-9-T3`.
Estimate_days: 1


### Story 1.1b — [P0-9b] 클릭 트래킹 2차 릴리즈
summary: P0-9 1차 서버 SoT 이후, 클릭 이벤트를 저장형 트래킹으로 연결해 제출 전 단계 퍼널을 확장한다.  
success_metric: `nav_signup/nav_request/nav_pricing/mobile_menu_*` 이벤트가 저장되고 클릭→제출 전환율이 대시보드에서 조회된다.
- [x] Progress: 완료

선행조건 체크리스트:
- [x] 클릭 이벤트 저장 API/저장소 구현 완료
- [x] Header + Mobile Menu CTA 모두 이벤트 호출 연결
- [x] `nav_pricing` 호출 경로(데스크톱/모바일) 검증 완료

#### Ticket `P0-9b-T1`
- [x] 진행완료
Title: 클릭 이벤트 저장 API + 랜딩 CTA 계측 연결
Goal: 클릭 이벤트를 서버 저장형으로 전환해 클릭→제출 퍼널의 SoT를 확보한다.
User-visible outcome: 운영자가 클릭 수와 클릭→제출 전환율을 대시보드에서 확인할 수 있다.
Scope / Out of scope: Scope는 이벤트 저장/헤더·모바일 CTA 연결/집계 API, Out은 GA4 대체와 고급 어트리뷰션.
Changes: DB(`LandingEvent` 저장), API(`POST /api/analytics/click`, `GET /api/admin/funnel/clicks`), UI(header/mobile menu/nav_pricing 계측), 로그(eventName/referrer/ua).
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "eventId": "evt_001",
    "eventName": "nav_pricing",
    "occurredAt": "2026-02-14T10:15:00Z"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "eventName is required",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 클릭 집계는 UTC 일 단위(`occurredAt`)로 집계하고, 이벤트명별 `count(*)`를 반환한다.
DoD:
- [x] `nav_signup/nav_request/nav_pricing/mobile_menu_open/mobile_menu_cta` 저장.
- [x] 클릭 집계 API와 P0-9 퍼널 화면 연동.
- [x] 클릭 지표는 2차 Story(P0-9b) 라벨로 1차 KPI와 분리 표시.
Validation:
- [x] 샘플 클릭 이벤트 20건 적재 후 집계 결과 확인.
- [x] header/mobile menu에서 동일 이벤트명이 중복 전송되지 않음을 검증.
Validation evidence: `docs/backlog/roadmap/validation/p0-9b-t1-click-tracking.log`
Dependencies/Blockers: `P0-9-T2`, `P0-9-T3`.
Estimate_days: 1

### Story 1.2 — [P0-10] 숫자형 가격 산식 엔진
summary: 일관된 산식과 변경근거 스냅샷을 남기는 견적 엔진을 배포한다.  
success_metric: 동일 입력 재실행 시 동일 금액이 나오고, 모든 견적 변경에 `changeReason`이 저장된다.
- [ ] Progress: 완료

#### Ticket `P0-10-T1`
- [ ] 진행완료
Title: 가격 정책 v1 정의서 분리 (연구/정의)
Goal: 입력값/가중치/반올림/상하한/정책버전을 문서로 확정한다.
User-visible outcome: 운영자가 "왜 이 금액인지" 정책표로 설명 가능하다.
Scope / Out of scope: Scope는 정책 정의와 예제 케이스 10개, Out은 DB 구현.
Changes: DB(없음), API(없음), UI(없음), 배치(없음), 로그(정책 시뮬레이션 결과).
DoD:
- [ ] `baseFee/duration/difficulty/urgency/frequency` 계산식이 확정.
- [ ] rounding(1000원), min/max(10,000/500,000)가 문서화.
- [ ] 정책 버전명(`v1`)과 변경 절차가 정의.
Validation:
- [ ] 샘플 입력 10개 계산 결과를 문서 표로 첨부.
- [ ] 운영 리뷰 코멘트 1회 반영.
Dependencies/Blockers: 없음.
Estimate_days: 1

#### Ticket `P0-10-T2`
- [ ] 진행완료
Title: PriceQuote 스키마 마이그레이션 적용
Goal: 정책 버전/입력스냅샷/가중치스냅샷/변경사유를 DB에 저장한다.
User-visible outcome: 케이스별 견적 이력 조회 기반이 생성된다.
Scope / Out of scope: Scope는 Prisma 모델+마이그레이션, Out은 화면.
Changes: DB(`PriceQuote` 모델), API(없음), UI(없음), 배치(없음), 로그(마이그레이션 실행 로그).
DoD:
- [ ] `pricingPolicyVersion`, `inputsSnapshot`, `weightsSnapshot`, `computedAmountKrw`, `roundedAmountKrw`, `changeReason` 필드 추가.
- [ ] 1차: 앱 레벨에서 기존 `isActive=true` quote를 비활성화 후 신규 quote 활성화.
- [ ] 롤백/재적용이 스테이징에서 검증된다.
Validation:
- [ ] `prisma migrate deploy` 후 스키마 확인 쿼리 실행.
- [ ] Insert/Update 샘플 2건으로 제약조건 검증.
Dependencies/Blockers: `P0-10-T1`.
Estimate_days: 1


#### Ticket `P0-10-T2b`
- [ ] 진행완료
Title: PriceQuote active DB 제약 2차 적용(부분 유니크 인덱스)
Goal: 운영 안정성 확인 후 `caseId` 기준 active quote 단일성을 DB에서 강제한다.
User-visible outcome: 동시성 상황에서도 케이스당 활성 견적이 1개로 보장된다.
Scope / Out of scope: Scope는 부분 유니크 인덱스 마이그레이션/롤백 스크립트, Out은 견적 UI 개편.
Changes: DB(partial unique index on `PriceQuote(caseId) where isActive=true`), API(없음), UI(없음), 배치(없음), 로그(마이그레이션 검증 로그).
DoD:
- [ ] 2차 마이그레이션으로 active 단일성 DB 강제.
- [ ] 기존 데이터 정합성 점검 쿼리 포함.
- [ ] 실패 시 롤백 절차 문서화.
Validation:
- [ ] 중복 active 데이터 삽입 시 DB 에러 재현.
- [ ] 마이그레이션 전/후 케이스 샘플 검증.
Dependencies/Blockers: `P0-10-T3` 1주 운영 안정성 확인.
Estimate_days: 1

#### Ticket `P0-10-T3`
- [ ] 진행완료
Title: pricing.service + 견적 미리보기/저장 API 구현
Goal: 산식 계산과 저장을 서버에서 단일 SoT로 제공한다.
User-visible outcome: 운영자가 케이스에서 "미리보기"와 "저장"을 눌러 즉시 견적 생성 가능하다.
Scope / Out of scope: Scope는 서비스+API+권한검증, Out은 화면 디자인 개선.
Changes: DB(PriceQuote CRUD), API(preview/save endpoint), UI(연동 훅), 로그(견적 생성 audit).
Scope lock:
- [ ] `apps/web/src/services/pricing.service.ts`
- [ ] `apps/web/src/app/api/admin/cases/[id]/pricing/preview/route.ts`
- [ ] `apps/web/src/app/api/admin/cases/[id]/pricing/quotes/route.ts`
- [ ] `packages/db/prisma/schema.prisma`
- [ ] `apps/web/src/services/__tests__/pricing.service.test.ts`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "caseId": "case_123",
    "pricingPolicyVersion": "v1",
    "computedAmountKrw": 34200,
    "roundedAmountKrw": 34000,
    "quoteId": "pq_001"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. save 호출 시 신규 quote row 생성 + 기존 active 비활성화(앱 레벨).
DoD:
- [ ] 동일 입력 재실행 시 동일 결과 보장.
- [ ] 저장 시 `changeReason` 누락이면 실패.
- [ ] 이전 활성 견적 비활성화 후 신규 활성화.
Validation:
- [ ] 단위 테스트 10개 이상(반올림/상하한/동일성).
- [ ] DB에서 활성 견적 1개 규칙 검증 SQL 실행.
Dependencies/Blockers: `P0-10-T2`.
Estimate_days: 2

#### Ticket `P0-10-T4`
- [ ] 진행완료
Title: Admin 케이스 견적 패널 UI 배포
Goal: 산식 근거와 변경 이력을 운영자가 한 화면에서 확인한다.
User-visible outcome: 케이스 상세에서 견적 분해식과 변경 이력이 표시된다.
Scope / Out of scope: Scope는 견적 패널/히스토리/저장 폼, Out은 PDF 출력.
Changes: DB(조회), API(`pricing preview/save/history`), UI(케이스 상세 컴포넌트), 로그(사용자 액션).
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "quotes": [
      {
        "quoteId": "pq_001",
        "roundedAmountKrw": 34000,
        "isActive": true,
        "changedBy": "admin_1",
        "changeReason": "urgency up"
      }
    ]
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 히스토리는 `updatedAt desc` 정렬, cursor pagination 없음(최대 50건).
DoD:
- [ ] 입력값 수정 시 예상 금액이 즉시 갱신.
- [ ] 저장 후 히스토리 목록에 신규 행 추가.
- [ ] `changeReason` 필수 검증이 UI/API 모두에서 동작.
Validation:
- [ ] 수동 재현: 2회 연속 가격 변경 후 이력 2건 확인.
- [ ] 컴포넌트 테스트 3개 이상 추가.
Dependencies/Blockers: `P0-10-T3`.
Estimate_days: 1

### Story 1.3 — [TD-1, TD-3] 즉시 기술부채 정리
summary: 에러 계층 표준화와 레거시 제거로 운영 안정성을 즉시 높인다.  
success_metric: `throw new Error` 사용량이 대상 서비스에서 제거되고, 빌드 경고 없이 배포된다.
- [ ] Progress: 완료

#### Ticket `TD-1-T1`
- [ ] 진행완료
Title: AppError 계층/공통 핸들러 도입
Goal: 서비스 에러를 HTTP 상태코드와 함께 일관 처리한다.
User-visible outcome: API 오류 응답 형식이 일관되고, 운영자가 원인코드를 확인 가능하다.
Scope / Out of scope: Scope는 공통 에러 클래스+핸들러+핵심 서비스 5개 적용, Out은 전 라우트 100% 전환.
Changes: DB(없음), API(에러 응답 표준화), UI(에러 메시지 키 연동), 로그(error.code 포함).
Scope lock:
- [ ] `packages/shared/src/errors/base.ts`
- [ ] `packages/shared/src/errors/resource.ts`
- [ ] `packages/shared/src/errors/validation.ts`
- [ ] `apps/web/src/lib/handle-service-error.ts`
- [ ] `apps/web/src/app/api/**/route.ts` (핵심 5개)
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "status": "accepted"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. 기존 API 규약을 깨지 않고 필드 추가는 backward-compatible로만 수행한다.
DoD:
- [ ] `AppError` 하위 타입(401/403/404/409/400) 구현.
- [ ] 핵심 API 5개 이상에서 `handleServiceError` 적용.
- [ ] 기존 테스트 통과 + 에러 매핑 테스트 추가.
Validation:
- [ ] 라우트 테스트로 HTTP code 매핑 검증.
- [ ] 로그에서 `error.code` 필드 출력 확인.
Dependencies/Blockers: 없음.
Estimate_days: 2

#### Ticket `TD-3-T1`
- [ ] 진행완료
Title: P0 소규모 정리 묶음 (처리량 버킷 + next.config 레거시)
Goal: 운영 차트 정밀도와 설정 정합성을 빠르게 개선한다.
User-visible outcome: 처리량 차트 분해능이 개선되고 빌드 설정에서 불필요한 puppeteer 참조가 제거된다.
Scope / Out of scope: Scope는 `throughput/history` 버킷 조정과 `next.config.ts` 정리, Out은 대시보드 전면 개편.
Changes: DB(없음), API(버킷 계산), UI(차트 변화 체감), 로그(응답 포인트 수).
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "status": "accepted"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. 기존 API 규약을 깨지 않고 필드 추가는 backward-compatible로만 수행한다.
DoD:
- [ ] `<=1h` 2분/`<=6h` 10분 버킷 적용.
- [ ] `serverExternalPackages`의 puppeteer 참조 제거.
- [ ] 웹 빌드/차트 API 스모크 테스트 통과.
Validation:
- [ ] API 응답 포인트 수 전/후 비교 로그 첨부.
- [ ] `pnpm --filter web build` 성공 확인.
Dependencies/Blockers: 없음.
Estimate_days: 0.5

---

## Epic 2 — Phase 2 운영 자동화/품질 기반 (P1)
summary: 자동 만료/알림 이중화/SLA 감시와 품질·보안 기반을 함께 구축한다.  
success_metric: 수동 개입 없이 만료 처리/알림 대체/SLA 위반 감지가 동작하고 운영 로그로 추적 가능하다.
- [ ] Progress: 완료

### Story 2.1 — [P1-1, P1-2, P1-4] 운영 자동화 핵심 루프
summary: 만료/알림 이중화/SLA 타이머를 배치+API+UI로 연결한다.  
success_metric: 자동 처리 건수가 대시보드에서 집계되고, 실패 알림이 대체 채널로 도달한다.
- [ ] Progress: 완료

#### Ticket `P1-1-T1`
- [ ] 진행완료
Title: 요청 기간 자동 만료 배치 배포
Goal: 기간 종료된 ACTIVE_MONITORING 케이스를 자동 EXPIRED로 전환한다.
User-visible outcome: 운영자가 수동 종료 없이 만료 케이스를 확인할 수 있다.
Scope / Out of scope: Scope는 스케줄러+상태전이+로그, Out은 환불 정책 자동화.
Changes: DB(Case/CaseStatusLog 업데이트), API(관리 조회 영향), UI(상태표시), 배치(일 1회 잡), 로그(만료 카운트).
Scope lock:
- [ ] `packages/worker-shared/src/runtime/caseExpiration.ts`
- [ ] `packages/worker-shared/src/runtime/scheduler.ts`
- [ ] `apps/worker/src/cycleProcessor.ts`
- [ ] `packages/db/sql/case_expiration_candidates.sql`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "status": "accepted"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. 기존 API 규약을 깨지 않고 필드 추가는 backward-compatible로만 수행한다.
DoD:
- [ ] 일 1회 만료 잡 실행.
- [ ] `ACTIVE_MONITORING -> EXPIRED` 전이와 reason 기록.
- [ ] 만료 건수 메트릭 로그 출력.
Validation:
- [ ] 드라이런 SQL과 실제 전이 결과 비교.
- [ ] 테스트 데이터 3건으로 상태전이 재현.
Dependencies/Blockers: 없음.
Estimate_days: 2

#### Ticket `P1-2-T1`
- [ ] 진행완료
Title: 카카오 실패 시 이메일 자동 전환 구현
Goal: 알림 실패 시 채널 fallback으로 도달률을 확보한다.
User-visible outcome: 카카오 실패 상황에서도 고객이 이메일로 알림을 받는다.
Scope / Out of scope: Scope는 채널 우선순위/재시도/채널 저장, Out은 텔레그램/라인.
Changes: DB(CaseNotification channel/attempt), API(알림 이력 조회), UI(채널 표기), 배치(재시도 잡), 로그(실패/대체 이벤트).
Scope lock:
- [ ] `packages/worker-shared/src/runtime/notifications.ts`
- [ ] `packages/worker-shared/src/observability/email/sender.ts`
- [ ] `apps/web/src/app/api/admin/notifications/delivery/route.ts`
- [ ] `apps/web/src/messages/ko/email.json`
- [ ] `apps/web/src/messages/en/email.json`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "status": "accepted"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. 기존 API 규약을 깨지 않고 필드 추가는 backward-compatible로만 수행한다.
DoD:
- [ ] 카카오 3회 실패 후 이메일 1회 자동 시도.
- [ ] 케이스별 도달 채널이 기록된다.
- [ ] 알림 실패 사유 코드 저장.
Validation:
- [ ] 카카오 mock fail 시나리오 테스트 추가.
- [ ] 도달률 집계 쿼리(`SENT/(SENT+FAILED)`) 결과 확인.
Dependencies/Blockers: 연락처 이메일 추출 가능 상태.
Estimate_days: 2

#### Ticket `P1-4-T1`
- [ ] 진행완료
Title: SLA 감시 잡 + Admin 위반 카운터 배포
Goal: 응답 지연 건을 5분 주기로 탐지해 운영자에게 경고한다.
User-visible outcome: Admin에서 SLA 위반 수와 대상 케이스를 즉시 확인한다.
Scope / Out of scope: Scope는 SLA 룰 3종(RECEIVED/WAITING_PAYMENT/NEEDS_CLARIFICATION), Out은 자동 에스컬레이션 정책 2차.
Changes: DB(SLA 대상 조회), API(위반 목록), UI(카운터/리스트), 배치(5분 스캔), 로그(SLA breach 이벤트).
Scope lock:
- [ ] `packages/worker-shared/src/runtime/slaMonitor.ts`
- [ ] `apps/web/src/services/admin/sla.service.ts`
- [ ] `apps/web/src/app/api/admin/sla/violations/route.ts`
- [ ] `packages/db/sql/sla_violations.sql`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "status": "accepted"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. 기존 API 규약을 깨지 않고 필드 추가는 backward-compatible로만 수행한다.
DoD:
- [ ] 3개 SLA 규칙이 설정값으로 동작.
- [ ] 위반 발생 시 알림 발송 이벤트 기록.
- [ ] Admin에 위반 건수 표시.
Validation:
- [ ] 시간 조작 테스트로 규칙별 위반 재현.
- [ ] 로그에서 `sla_rule`, `caseId` 필드 확인.
Dependencies/Blockers: `TD-2-T1` 구조화 로깅 권장.
Estimate_days: 2

### Story 2.2 — 품질/보안 기반 강화
summary: 환경변수 검증, 구조화 로깅, CORS/CSP/보안헤더, 테스트 기반을 한 번에 세운다.  
success_metric: 배포 전 누락 ENV 차단, 에러 추적 필드 표준화, 보안 스캔 경고 감소.
- [ ] Progress: 완료

#### Ticket `SEC-4-T1`
- [ ] 진행완료
Title: Web/Worker 환경변수 Zod fail-fast 도입
Goal: 잘못된 설정으로 앱이 기동되는 상황을 제거한다.
User-visible outcome: 운영자가 잘못된 배포를 즉시 감지할 수 있다.
Scope / Out of scope: Scope는 필수 ENV 스키마와 시작시 검증, Out은 시크릿 로테이션 자동화.
Changes: DB(없음), API(기동 가드), UI(없음), 배치(워커 기동 가드), 로그(검증 실패 상세).
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "status": "accepted"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. 기존 API 규약을 깨지 않고 필드 추가는 backward-compatible로만 수행한다.
DoD:
- [ ] web/worker 각각 ENV 스키마 정의.
- [ ] 누락/형식오류 시 프로세스 즉시 종료.
- [ ] `.env.example`와 스키마 키가 동기화.
Validation:
- [ ] 의도적 누락 ENV로 기동 실패 확인.
- [ ] CI에서 스키마 체크 스크립트 통과.
Dependencies/Blockers: 없음.
Estimate_days: 1

#### Ticket `TD-2-T1`
- [ ] 진행완료
Title: pino 구조화 로깅 + requestId 연동
Goal: API/워커 로그를 공통 포맷으로 통합한다.
User-visible outcome: 운영자가 장애 원인을 requestId/caseId 기준으로 빠르게 추적한다.
Scope / Out of scope: Scope는 logger factory+미들웨어+핵심 경로 적용, Out은 Loki/Grafana 수집.
Changes: DB(없음), API(requestId 주입), UI(없음), 배치(워커 jobId 로깅), 로그(JSON 구조화).
Scope lock:
- [ ] `packages/worker-shared/src/observability/logger.ts`
- [ ] `apps/web/src/middleware/request-id.ts`
- [ ] `apps/web/src/app/api/**/route.ts` (핵심 경로)
- [ ] `apps/worker/src/cycleProcessor.ts`
- [ ] `apps/worker/src/checkProcessor.ts`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "status": "accepted"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. 기존 API 규약을 깨지 않고 필드 추가는 backward-compatible로만 수행한다.
DoD:
- [ ] `debug/info/warn/error` 레벨 적용.
- [ ] API 로그에 `requestId`, 워커 로그에 `jobId` 포함.
- [ ] `console.error` 직접 호출이 대상 파일에서 제거.
Validation:
- [ ] 로거 스냅샷 테스트 작성.
- [ ] 샘플 요청 1건에 대해 연쇄 로그 추적 가능 확인.
Dependencies/Blockers: 없음.
Estimate_days: 2

#### Ticket `SEC-1-2-6-T1`
- [ ] 진행완료
Title: CORS/CSP/보안헤더 1차 적용
Goal: 기본 보안 헤더를 middleware에서 강제한다.
User-visible outcome: 운영자 보안 점검에서 누락 항목(CORS/CSP)이 해소된다.
Scope / Out of scope: Scope는 허용 origin, CSP, X-Frame-Options 등, Out은 B2B API 키 인증.
Changes: DB(없음), API(헤더 적용), UI(없음), 배치(없음), 로그(차단 origin 기록).
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "status": "accepted"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. 기존 API 규약을 깨지 않고 필드 추가는 backward-compatible로만 수행한다.
DoD:
- [ ] CORS 허용 origin이 환경변수 기반으로 동작.
- [ ] CSP/보안헤더 기본 세트가 응답에 포함.
- [ ] 허용되지 않은 origin 접근 로그 기록.
Validation:
- [ ] curl로 헤더 스모크 테스트.
- [ ] 브라우저 콘솔 CSP 위반 여부 확인.
Dependencies/Blockers: `SEC-4-T1`.
Estimate_days: 1

#### Ticket `TEST-P1-T1`
- [ ] 진행완료
Title: Worker 핵심 프로세서 단위테스트 패키지
Goal: `cycleProcessor/checkProcessor` 회귀를 방지한다.
User-visible outcome: 운영자가 체감하는 체크/알림 실패율이 감소한다.
Scope / Out of scope: Scope는 핵심 시나리오 테스트(상태결정/재시도/증거생성), Out은 E2E.
Changes: DB(mock prisma), API(없음), UI(없음), 배치(프로세서 로직 검증), 로그(테스트 리포트).
Scope lock:
- [ ] `apps/worker/src/cycleProcessor.ts`
- [ ] `apps/worker/src/checkProcessor.ts`
- [ ] `apps/worker/src/__tests__/cycleProcessor.test.ts`
- [ ] `apps/worker/src/__tests__/checkProcessor.test.ts`
- [ ] `packages/worker-shared/src/runtime/__tests__/conditionTrigger.test.ts`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
DoD:
- [ ] 두 프로세서 합계 테스트 20개 이상.
- [ ] 실패 재시도/멱등 케이스 포함.
- [ ] CI에서 테스트 통과.
Validation:
- [ ] `pnpm test --filter worker` 결과 첨부.
- [ ] 커버리지 리포트에서 대상 파일 70% 이상.
Dependencies/Blockers: 없음.
Estimate_days: 2

#### Ticket `I18N-APP-T1`
- [ ] 진행완료
Title: App 페이지 i18n 1차 (Dashboard/Accommodations/Settings)
Goal: 인증 영역 핵심 페이지의 하드코딩 텍스트를 다국어 키로 전환한다.
User-visible outcome: 언어 전환 시 주요 앱 화면 텍스트가 번역되어 표시된다.
Scope / Out of scope: Scope는 app 네임스페이스와 핵심 3페이지, Out은 Admin 전체 i18n.
Changes: DB(없음), API(기존), UI(번역 키 적용), 배치(없음), 로그(locale 변경 이벤트).
Scope lock:
- [ ] `apps/web/src/messages/ko/app.json`
- [ ] `apps/web/src/messages/en/app.json`
- [ ] `apps/web/src/app/(app)/dashboard/page.tsx`
- [ ] `apps/web/src/app/(app)/accommodations/page.tsx`
- [ ] `apps/web/src/app/(app)/settings/page.tsx`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "status": "accepted"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. 기존 API 규약을 깨지 않고 필드 추가는 backward-compatible로만 수행한다.
DoD:
- [ ] app 메시지 파일(`ko/en`) 추가/정리.
- [ ] Dashboard/Accommodations/Settings 핵심 텍스트 i18n 전환.
- [ ] 미번역 키 fallback 동작.
Validation:
- [ ] locale 전환 수동 테스트 시나리오 통과.
- [ ] snapshot 테스트로 키 누락 감지.
Dependencies/Blockers: `I18N` 아키텍처 문서 기준 확정.
Estimate_days: 2

---

## Epic 3 — Phase 3 셀프서비스/결제/중기 품질
summary: Google Form 의존을 줄이고 결제 자동화와 운영 품질 체계를 구축한다.  
success_metric: 웹 접수→결제확인→상태조회 플로우가 E2E로 재현되고 KPI 측정이 가능해진다.
- [ ] Progress: 완료

### Story 3.1 — [7.1, 7.3] 셀프서비스 접수 + 상태 조회
summary: 공개 접수 페이지와 토큰 기반 상태 페이지를 릴리즈한다.  
success_metric: 신규 접수가 FormSubmission으로 저장되고, 고객이 `/status/[token]`에서 상태를 확인한다.
- [ ] Progress: 완료

#### Ticket `P2-INTAKE-T1`
- [ ] 진행완료
Title: 셀프서비스 접수 계약 정의서 (연구/정의)
Goal: 공개 폼 필드와 FormSubmission 매핑 규칙을 확정한다.
User-visible outcome: 운영자가 수집 항목/검증 규칙을 사전에 합의할 수 있다.
Scope / Out of scope: Scope는 필드 스펙/검증 규칙/모호성 경고 정의, Out은 구현 코드.
Changes: DB(없음), API(없음), UI(없음), 배치(없음), 로그(샘플 payload 검증 로그).
DoD:
- [ ] 필수 필드/선택 필드 스펙 문서화.
- [ ] URL 파서 실패/모호성 기준 정의.
- [ ] 기존 Google Form 필드와 매핑표 제공.
Validation:
- [ ] 샘플 payload 10개로 계약 검증.
- [ ] 운영 리뷰 승인 1회.
Dependencies/Blockers: 없음.
Estimate_days: 1

#### Ticket `P2-INTAKE-T2`
- [ ] 진행완료
Title: 공개 접수 API + FormSubmission 저장 구현
Goal: `/request/new` 제출을 서버에서 검증 후 저장한다.
User-visible outcome: 고객 제출이 즉시 접수되고 운영자가 Admin에서 확인 가능하다.
Scope / Out of scope: Scope는 API/검증/저장/기본 rate-limit, Out은 UI 고도화.
Changes: DB(FormSubmission 생성), API(공개 제출 엔드포인트), UI(성공/오류 연동), 로그(submissionId, source).
Scope lock:
- [ ] `apps/web/src/app/api/request/new/route.ts`
- [ ] `apps/web/src/services/intake.service.ts`
- [ ] `apps/web/src/lib/schemas/request-intake.ts`
- [ ] `packages/db/prisma/schema.prisma`
- [ ] `apps/web/src/app/api/request/new/__tests__/route.test.ts`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "submissionId": "sub_001",
    "responseId": "resp_001",
    "createdAt": "2026-02-14T10:20:00Z"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. `responseId` unique로 중복 제출 차단.
DoD:
- [ ] Zod 검증 실패 시 명확한 오류 반환.
- [ ] 성공 시 FormSubmission/responseId 저장.
- [ ] 기본 스팸 방지(rate-limit) 적용.
Validation:
- [ ] API 테스트 8개 이상.
- [ ] SQL로 저장 건수/중복(responseId) 검증.
Dependencies/Blockers: `P2-INTAKE-T1`.
Estimate_days: 2

#### Ticket `P2-INTAKE-T3`
- [ ] 진행완료
Title: `/request/new` UI + 실시간 유효성 검사
Goal: 사용자가 스스로 접수 가능한 공개 폼 UX를 제공한다.
User-visible outcome: 고객이 폼에서 오류를 즉시 확인하고 제출 완료 메시지를 본다.
Scope / Out of scope: Scope는 폼 UI/실시간 검증/완료 화면, Out은 결제.
Changes: DB(없음), API(제출 API 연동), UI(공개 폼 페이지), 로그(폼 단계 이벤트).
Scope lock:
- [ ] `apps/web/src/app/request/new/page.tsx`
- [ ] `apps/web/src/app/request/new/_components/request-form.tsx`
- [ ] `apps/web/src/app/request/new/_components/request-success.tsx`
- [ ] `apps/web/src/lib/schemas/request-intake.ts`
- [ ] `apps/web/src/app/request/new/__tests__/request-form.test.tsx`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "submissionId": "sub_001",
    "next": "/request/new?success=1"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- UI는 submit 결과의 `submissionId`만 의존한다.
DoD:
- [ ] URL/날짜/동의 체크 실시간 검증.
- [ ] 제출 성공/실패 상태 메시지 표시.
- [ ] 모바일 뷰에서 주요 입력 정상 동작.
Validation:
- [ ] 재현 테스트: 정상/오류/중복 제출 케이스.
- [ ] 프론트 컴포넌트 테스트 5개 이상.
Dependencies/Blockers: `P2-INTAKE-T2`.
Estimate_days: 2

#### Ticket `P2-1-T1`
- [ ] 진행완료
Title: 고객 상태 페이지 토큰 조회 API + UI
Goal: 비로그인 토큰 링크로 케이스 상태를 노출한다.
User-visible outcome: 고객이 직접 진행 상태/최근 알림 시각을 확인한다.
Scope / Out of scope: Scope는 token 발급/조회 및 `/status/[token]` UI, Out은 내부 운영 로그 노출.
Changes: DB(status token 저장), API(status 조회), UI(status page), 로그(token access).
Scope lock:
- [ ] `apps/web/src/app/api/status/[token]/route.ts`
- [ ] `apps/web/src/app/status/[token]/page.tsx`
- [ ] `apps/web/src/services/status-token.service.ts`
- [ ] `packages/db/prisma/schema.prisma`
- [ ] `apps/web/src/app/status/[token]/__tests__/page.test.tsx`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "status": "ACTIVE_MONITORING",
    "latestNotifiedAt": "2026-02-14T09:00:00Z",
    "timeline": [
      {
        "at": "2026-02-14T09:00:00Z",
        "status": "WAITING_PAYMENT"
      }
    ]
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 타임라인은 최신순 최대 30건 반환.
DoD:
- [ ] 케이스당 토큰 1개 발급/조회.
- [ ] 상태/타임라인/주의 문구("예약 대행 아님") 노출.
- [ ] 내부 민감 정보 비노출.
Validation:
- [ ] 유효/만료/무효 토큰 접근 테스트.
- [ ] 접근 로그에서 token hash 기반 추적 가능.
Dependencies/Blockers: 케이스 상태 데이터 준비.
Estimate_days: 2

### Story 3.2 — [7.2, KPI KR3] 결제 자동화와 매출 SoT 전환
summary: Payment 모델 도입으로 결제확인 자동화와 매출 지표 기반을 만든다.  
success_metric: 결제 완료 시 `Case.paymentConfirmedAt`가 자동 업데이트되고 매출 집계가 Payment 기준으로 계산된다.
- [ ] Progress: 완료

#### Ticket `PAY-T1`
- [ ] 진행완료
Title: 결제 상태머신/웹훅 계약 정의 (연구/정의)
Goal: 결제 라이프사이클과 idempotency 규칙을 확정한다.
User-visible outcome: 운영자가 결제 상태 전이를 표준 절차로 확인할 수 있다.
Scope / Out of scope: Scope는 상태 다이어그램/웹훅 서명검증/재처리 정책, Out은 UI.
Changes: DB(없음), API(없음), UI(없음), 배치(없음), 로그(웹훅 시뮬레이션 로그).
DoD:
- [ ] `PENDING/PAID/FAILED/REFUNDED` 상태 정의.
- [ ] 웹훅 idempotency 키 규칙 확정.
- [ ] 실패/재시도 시나리오 문서화.
Validation:
- [ ] 샘플 웹훅 이벤트 5종 계약 테스트.
- [ ] 운영/개발 합의 승인.
Dependencies/Blockers: PG 선정.
Estimate_days: 1

#### Ticket `PAY-T2`
- [ ] 진행완료
Title: Payment 모델 마이그레이션 + 웹훅 처리 API
Goal: 결제 이벤트를 DB에 저장하고 케이스 결제확인 상태를 자동 반영한다.
User-visible outcome: 수동 결제확인 없이 케이스가 자동으로 결제확인 상태가 된다.
Scope / Out of scope: Scope는 Payment 모델/웹훅 엔드포인트/Case 연동, Out은 환불 자동화.
Changes: DB(Payment 모델, Case 1:1), API(웹훅 처리), UI(기존 상태 표시 영향), 로그(webhook eventId).
Scope lock:
- [ ] `packages/db/prisma/schema.prisma`
- [ ] `apps/web/src/app/api/payments/webhook/route.ts`
- [ ] `apps/web/src/services/payment.service.ts`
- [ ] `apps/web/src/services/cases.service.ts`
- [ ] `apps/web/src/app/api/payments/webhook/__tests__/route.test.ts`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "paymentId": "pay_001",
    "status": "PAID",
    "caseId": "case_123",
    "paymentConfirmedAt": "2026-02-14T11:00:00Z"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 웹훅은 `eventId` idempotency로 중복 처리 방지.
DoD:
- [ ] 결제 완료 이벤트로 Payment row 생성.
- [ ] `Case.paymentConfirmedAt` 자동 업데이트.
- [ ] 중복 웹훅 처리 방지(idempotent).
Validation:
- [ ] 통합 테스트: 결제완료 웹훅 재전송 2회.
- [ ] SQL로 Payment-Case 일치 검증.
Dependencies/Blockers: `PAY-T1`.
Estimate_days: 2

#### Ticket `PAY-T3`
- [ ] 진행완료
Title: 결제 상태 타임라인 UI + 정산 검증 쿼리
Goal: 운영자/고객이 결제 상태를 동일하게 확인하고 월 정산 기준을 검증한다.
User-visible outcome: 케이스 상세와 고객 상태페이지에 결제 상태/시각이 보인다.
Scope / Out of scope: Scope는 UI 타임라인+정산 SQL, Out은 회계 시스템 연동.
Changes: DB(Payment 조회), API(결제 상태 응답 확장), UI(Admin/Customer 상태표시), 로그(정산 점검 로그).
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "caseId": "case_123",
    "payment": {
      "status": "PAID",
      "amount": 34000,
      "paidAt": "2026-02-14T11:00:00Z"
    }
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 월 매출 집계는 Payment.paidAt 월 기준 `sum(amount)`만 사용.
DoD:
- [ ] 결제 상태가 2개 화면(Admin/Customer)에 표시.
- [ ] 월 매출 집계 SQL이 Payment 기준으로 추가.
- [ ] BillingEvent와 매출 SoT 구분 주석 유지.
Validation:
- [ ] Payment 기준 월합계와 화면 값 대조.
- [ ] 수동 재현: 결제 완료 후 타임라인 갱신 확인.
Dependencies/Blockers: `PAY-T2`.
Estimate_days: 1

### Story 3.3 — [7.4, 7.5, 7.6, 7.7, 7.8] 중기 품질 기반
summary: 문서화/통합테스트/캐싱/증거봉인/로케일 저장을 실행 가능한 단위로 배포한다.  
success_metric: 주요 플로우 통합테스트가 CI를 통과하고, 증거 패킷 봉인/locale 반영이 실데이터에서 검증된다.
- [ ] Progress: 완료

#### Ticket `API-1-T1`
- [ ] 진행완료
Title: OpenAPI 자동문서 1차 배포 (핵심 20개 엔드포인트)
Goal: API 명세를 코드 기반으로 자동 생성한다.
User-visible outcome: 개발자가 `/api/docs`에서 최신 스펙을 확인할 수 있다.
Scope / Out of scope: Scope는 핵심 엔드포인트 명세화와 CI 스펙 생성, Out은 51개 전체 완성.
Changes: DB(없음), API(zod 메타데이터), UI(Swagger UI), 로그(CI 스펙 생성 로그).
Scope lock:
- [ ] `packages/shared/src/openapi/index.ts`
- [ ] `apps/web/src/app/api/docs/route.ts`
- [ ] `apps/web/src/app/api/docs/page.tsx`
- [ ] `scripts/generate-openapi.ts`
- [ ] `.github/workflows/ci.yml`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "binbang api",
    "version": "1.0.0"
  },
  "paths": {
    "/api/admin/funnel": {
      "get": {
        "summary": "Get funnel KPI"
      }
    }
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 규약은 `cursor`/`limit`로 통일, 집계 API는 범위(from/to)를 명시.
DoD:
- [ ] 핵심 20개 엔드포인트 OpenAPI 노출.
- [ ] CI에서 스펙 생성/검증 단계 추가.
- [ ] 문서와 실제 응답 타입 불일치 0건.
Validation:
- [ ] 스펙 diff를 PR artifact로 업로드.
- [ ] 샘플 5개 엔드포인트 응답 검증 테스트.
Dependencies/Blockers: `TD-1-T1` 권장.
Estimate_days: 2

#### Ticket `IT-T1`
- [ ] 진행완료
Title: Testcontainers 통합테스트 하네스 (IT-1~IT-3)
Goal: 핵심 비즈니스 플로우를 DB/Redis 포함 환경에서 자동 검증한다.
User-visible outcome: 회귀 배포 전에 접수→케이스→결제→조건충족 흐름 검증이 가능하다.
Scope / Out of scope: Scope는 IT-1/IT-2/IT-3, Out은 브라우저 E2E.
Changes: DB(test schema), API(통합테스트 대상), UI(없음), 배치(worker path 포함), 로그(test report).
Scope lock:
- [ ] `tests/integration/setup/testcontainers.ts`
- [ ] `tests/integration/it-1-accommodation.spec.ts`
- [ ] `tests/integration/it-2-intake-case.spec.ts`
- [ ] `tests/integration/it-3-payment-condition.spec.ts`
- [ ] `.github/workflows/ci.yml`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "status": "accepted"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. 기존 API 규약을 깨지 않고 필드 추가는 backward-compatible로만 수행한다.
DoD:
- [ ] PostgreSQL/Redis 컨테이너 기반 테스트 실행.
- [ ] IT-1~IT-3 시나리오 자동화.
- [ ] CI stage에서 통합테스트 통과.
Validation:
- [ ] 실패 재현 로그와 통과 로그 비교.
- [ ] 테스트 커버리지 리포트에 통합 영역 반영.
Dependencies/Blockers: `PAY-T2`, `P2-INTAKE-T2`.
Estimate_days: 2

#### Ticket `TD-9-PERF-1-T1`
- [ ] 진행완료
Title: 정적 참조 데이터 캐시 + 무효화 구현
Goal: roles/plans/settings 반복 조회를 줄여 응답지연을 낮춘다.
User-visible outcome: Admin 조회 응답이 더 빠르고 일관된다.
Scope / Out of scope: Scope는 5분 TTL 메모리캐시와 설정 변경 시 무효화, Out은 Redis 분산 캐시.
Changes: DB(조회 패턴 변경), API(캐시 경유), UI(응답속도 체감), 로그(cache hit/miss).
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "status": "accepted"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. 기존 API 규약을 깨지 않고 필드 추가는 backward-compatible로만 수행한다.
DoD:
- [ ] 대상 3종 데이터 캐시 적용.
- [ ] 관리자 변경 시 캐시 무효화 동작.
- [ ] hit/miss 메트릭 로그 추가.
Validation:
- [ ] 부하 전후 응답시간 비교.
- [ ] 캐시 무효화 재현 테스트 1개 이상.
Dependencies/Blockers: 없음.
Estimate_days: 1

#### Ticket `P1-5-T1`
- [ ] 진행완료
Title: Evidence Packet 봉인/부분실패 재시도 구현
Goal: 조건충족 증거의 무결성과 멱등성을 보장한다.
User-visible outcome: 운영자가 봉인 상태(SEALED/PARTIAL)와 재시도 이력을 확인할 수 있다.
Scope / Out of scope: Scope는 봉인 상태머신/멱등키/재시도 큐, Out은 외부 감사 포털.
Changes: DB(evidence 상태 필드), API(상태 조회), UI(봉인 배지), 배치(재시도 잡), 로그(seal event).
Scope lock:
- [ ] `packages/worker-shared/src/runtime/evidenceSeal.ts`
- [ ] `packages/worker-shared/src/runtime/conditionTrigger.ts`
- [ ] `apps/web/src/app/api/admin/evidence/[caseId]/route.ts`
- [ ] `packages/db/prisma/schema.prisma`
- [ ] `packages/worker-shared/src/runtime/__tests__/evidenceSeal.test.ts`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "status": "accepted"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. 기존 API 규약을 깨지 않고 필드 추가는 backward-compatible로만 수행한다.
DoD:
- [ ] `caseId+firstConditionMetAt` 멱등키 적용.
- [ ] `SEALED` 이후 수정 차단.
- [ ] 부분실패 시 `PARTIAL`+재시도 큐 적재.
Validation:
- [ ] 중복 트리거 테스트(2회 호출)로 멱등 확인.
- [ ] 봉인/부분실패 상태 전이 로그 확인.
Dependencies/Blockers: 조건충족 이벤트 안정화.
Estimate_days: 2

#### Ticket `I18N-USER-T1`
- [ ] 진행완료
Title: preferredLocale 저장/반영 E2E 연결
Goal: 사용자 선호 언어를 저장하고 알림/화면에 반영한다.
User-visible outcome: 설정에서 언어 변경 후 상태페이지/알림 언어가 바뀐다.
Scope / Out of scope: Scope는 User 필드+설정 UI+알림 템플릿 반영, Out은 Admin 전체 i18n.
Changes: DB(User.preferredLocale), API(설정 저장), UI(Settings), 배치(알림 locale 선택), 로그(locale applied).
Scope lock:
- [ ] `packages/db/prisma/schema.prisma`
- [ ] `apps/web/src/app/api/user/locale/route.ts`
- [ ] `apps/web/src/app/(app)/settings/page.tsx`
- [ ] `packages/worker-shared/src/runtime/notifications.ts`
- [ ] `apps/web/src/app/api/user/locale/__tests__/route.test.ts`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "status": "accepted"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. 기존 API 규약을 깨지 않고 필드 추가는 backward-compatible로만 수행한다.
DoD:
- [ ] `preferredLocale` 스키마/마이그레이션 완료.
- [ ] 설정 저장 시 즉시 반영.
- [ ] 알림 발송 시 locale 우선순위 적용.
Validation:
- [ ] 언어 변경 전후 알림 템플릿 비교.
- [ ] DB 값과 발송 locale 로그 일치 확인.
Dependencies/Blockers: `I18N-APP-T1`.
Estimate_days: 2

---

## Epic 4 — Phase 4 확장/고급 운영
summary: 플랫폼 확장과 운영 대시보드 고도화를 리스크 낮은 수직 슬라이스로 진행한다.  
success_metric: 신규 플랫폼 1개(Booking) 실사용 가능, 운영 리스크/가용성/관측성 화면이 배포된다.
- [ ] Progress: 완료

### Story 4.1 — [8.1, 8.2, 8.3] 플랫폼/채널 확장
summary: Booking 우선 지원과 국내 플랫폼 사전검증, 알림 채널 추가를 단계적으로 진행한다.  
success_metric: Booking URL 1건 이상이 실제 체크되고 텔레그램 채널로 알림 수신 테스트가 성공한다.
- [ ] Progress: 완료

#### Ticket `BOOKING-T1`
- [ ] 진행완료
Title: Booking.com 수직 슬라이스 (파서+체커+운영 확인)
Goal: Booking URL을 신규 모니터링 대상으로 처리 가능하게 만든다.
User-visible outcome: 운영자가 Booking 숙소를 등록해 상태 체크 결과를 확인한다.
Scope / Out of scope: Scope는 enum/파서/체커/기본 셀렉터/관리 확인, Out은 고급 최적화.
Changes: DB(Platform enum/selector seed), API(URL parse/check), UI(관리 확인 화면), 배치(worker checker), 로그(platform=BOOKING).
Scope lock:
- [ ] `packages/shared/src/checkers/constants.ts`
- [ ] `packages/worker-shared/src/browser/booking.ts`
- [ ] `packages/shared/src/url/parse-platform.ts`
- [ ] `packages/db/prisma/seed/selector.booking.ts`
- [ ] `packages/worker-shared/src/browser/__tests__/booking.test.ts`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "status": "accepted"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. 기존 API 규약을 깨지 않고 필드 추가는 backward-compatible로만 수행한다.
DoD:
- [ ] Booking URL 파싱 및 플랫폼 식별 성공.
- [ ] 체크 결과가 CheckLog에 저장.
- [ ] Admin에서 Booking 케이스 조회 가능.
Validation:
- [ ] 실 URL fixture 3개 통합 테스트.
- [ ] 체크 성공/실패 로그 필드 검증.
Dependencies/Blockers: 없음.
Estimate_days: 2

#### Ticket `DOMESTIC-T1`
- [ ] 진행완료
Title: 야놀자/여기어때 체크 가능성 스파이크
Goal: 국내 플랫폼 2종의 파싱/셀렉터 안정성을 사전 평가한다.
User-visible outcome: 운영자가 "지원 가능/리스크" 판단표를 확인한다.
Scope / Out of scope: Scope는 샘플 URL/DOM 분석/fixture 테스트, Out은 프로덕션 배포.
Changes: DB(없음), API(없음), UI(없음), 배치(POC checker), 로그(실패 패턴 수집).
Scope lock:
- [ ] `docs/spikes/domestic-platform-feasibility.md`
- [ ] `packages/worker-shared/src/browser/yanolja.poc.ts`
- [ ] `packages/worker-shared/src/browser/goodchoice.poc.ts`
- [ ] `packages/shared/src/url/domestic-parser.poc.ts`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
DoD:
- [ ] 플랫폼별 최소 10개 URL 샘플 분석.
- [ ] 실패 유형(차단/동적로딩/파싱불가) 분류.
- [ ] 구현 난이도/예상공수 문서화.
Validation:
- [ ] 스파이크 결과 리포트 제출.
- [ ] fixture 테스트 통과율 보고.
Dependencies/Blockers: 없음.
Estimate_days: 2

#### Ticket `CHANNEL-T1`
- [ ] 진행완료
Title: 텔레그램 채널 추가 + 사용자 선호 채널 설정
Goal: 카카오/이메일 외 텔레그램 채널을 운영 옵션으로 제공한다.
User-visible outcome: 사용자가 설정에서 텔레그램을 선택하고 실제 알림을 받는다.
Scope / Out of scope: Scope는 Bot API 연동/설정 UI/발송 로직, Out은 LINE/SMS.
Changes: DB(채널 선호 저장), API(채널 설정), UI(Settings 채널 선택), 배치(알림 채널 분기), 로그(channel delivery).
Scope lock:
- [ ] `packages/worker-shared/src/observability/telegram/sender.ts`
- [ ] `packages/worker-shared/src/runtime/notifications.ts`
- [ ] `apps/web/src/app/api/user/notification-channels/route.ts`
- [ ] `apps/web/src/app/(app)/settings/notifications/page.tsx`
- [ ] `apps/web/src/app/api/user/notification-channels/__tests__/route.test.ts`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "status": "accepted"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. 기존 API 규약을 깨지 않고 필드 추가는 backward-compatible로만 수행한다.
DoD:
- [ ] 텔레그램 발송 경로가 채널 인터페이스에 통합.
- [ ] 사용자별 선호 채널 저장/조회.
- [ ] 실패 시 기존 fallback 규칙 유지.
Validation:
- [ ] 테스트 봇으로 발송 성공/실패 케이스 검증.
- [ ] 채널별 도달률 로그 확인.
Dependencies/Blockers: `P1-2-T1`.
Estimate_days: 2

### Story 4.2 — [8.4, 8.5, 8.6, 8.7, 14] 품질/리스크/관측성 고도화
summary: E2E, Admin i18n, 리스크 배지, 가용성 대시보드, 관측성 파이프라인을 운영 가능한 수준으로 올린다.  
success_metric: CI E2E 통과, 리스크/가용성/로그 대시보드에서 핵심 운영 지표를 볼 수 있다.
- [ ] Progress: 완료

#### Ticket `E2E-T1`
- [ ] 진행완료
Title: Playwright 핵심 E2E 4개 시나리오 CI 연동
Goal: 사용자/관리자 핵심 플로우를 브라우저 레벨에서 회귀 방지한다.
User-visible outcome: 배포 전 주요 플로우 깨짐이 자동 감지된다.
Scope / Out of scope: Scope는 signup/login/accommodation/admin-case 시나리오, Out은 전체 페이지 커버리지.
Changes: DB(test seed), API(실행 대상), UI(E2E 대상), 배치(없음), 로그(CI 리포트).
Scope lock:
- [ ] `apps/web/e2e/playwright.config.ts`
- [ ] `apps/web/e2e/auth.spec.ts`
- [ ] `apps/web/e2e/accommodations.spec.ts`
- [ ] `apps/web/e2e/admin-cases.spec.ts`
- [ ] `.github/workflows/ci.yml`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "status": "accepted"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. 기존 API 규약을 깨지 않고 필드 추가는 backward-compatible로만 수행한다.
DoD:
- [ ] 핵심 4개 시나리오 작성.
- [ ] CI stage에 E2E job 추가.
- [ ] 실패 시 스크린샷/trace artifact 저장.
Validation:
- [ ] PR에서 E2E job 실행 결과 확인.
- [ ] flaky 테스트 재시도 정책 검증.
Dependencies/Blockers: 테스트 계정/시드 준비.
Estimate_days: 2

#### Ticket `ADMIN-I18N-T1`
- [ ] 진행완료
Title: Admin i18n 1차 (Nav + Cases List/Detail)
Goal: Admin 핵심 페이지의 하드코딩 텍스트를 다국어로 전환한다.
User-visible outcome: 운영자가 언어 변경 시 Admin 메뉴/케이스 화면 텍스트가 번역된다.
Scope / Out of scope: Scope는 네비/케이스 목록/상세, Out은 모든 Admin 페이지 전환.
Changes: DB(없음), API(기존), UI(admin 메시지 키 적용), 배치(없음), 로그(locale switch).
Scope lock:
- [ ] `apps/web/src/messages/ko/admin.json`
- [ ] `apps/web/src/messages/en/admin.json`
- [ ] `apps/web/src/app/admin/layout.tsx`
- [ ] `apps/web/src/app/admin/cases/page.tsx`
- [ ] `apps/web/src/app/admin/cases/[id]/page.tsx`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "status": "accepted"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. 기존 API 규약을 깨지 않고 필드 추가는 backward-compatible로만 수행한다.
DoD:
- [ ] `admin.json` 메시지 파일 정리.
- [ ] Nav/Cases list/detail 텍스트 i18n 전환.
- [ ] 누락 키 fallback 처리.
Validation:
- [ ] 언어 전환 수동 시나리오 점검.
- [ ] i18n key snapshot 테스트.
Dependencies/Blockers: `I18N-APP-T1`.
Estimate_days: 2

#### Ticket `P2-2-T1`
- [ ] 진행완료
Title: 분쟁 리스크 스코어링 v1 + 배지 표시
Goal: 고위험 케이스를 사전에 식별해 운영 우선순위를 높인다.
User-visible outcome: 케이스 목록에서 HIGH/MEDIUM/LOW 리스크 배지가 표시된다.
Scope / Out of scope: Scope는 점수 계산/등급 배지/필터, Out은 ML 모델.
Changes: DB(리스크 점수 저장), API(점수 계산/조회), UI(배지/필터), 배치(점수 재계산), 로그(risk factors).
Scope lock:
- [ ] `apps/web/src/services/risk-score.service.ts`
- [ ] `apps/web/src/app/api/admin/cases/risk/route.ts`
- [ ] `apps/web/src/app/admin/cases/_components/risk-badge.tsx`
- [ ] `apps/web/src/app/admin/cases/_components/risk-filter.tsx`
- [ ] `apps/web/src/services/__tests__/risk-score.service.test.ts`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "status": "accepted"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 페이지네이션 없음. 기존 API 규약을 깨지 않고 필드 추가는 backward-compatible로만 수행한다.
DoD:
- [ ] 점수 0~100 및 등급 규칙 적용.
- [ ] 케이스 목록 필터에 리스크 등급 추가.
- [ ] HIGH 케이스 카운트 집계.
Validation:
- [ ] 샘플 케이스 10건으로 등급 검증.
- [ ] 점수 계산 단위 테스트 작성.
Dependencies/Blockers: 입력 팩터 정의 필요.
Estimate_days: 2

#### Ticket `AVAIL-OBS-T1`
- [ ] 진행완료
Title: 가용성 대시보드 MVP + Grafana/Loki 수집 시작
Goal: 운영자가 가용 패턴과 시스템 상태를 한 번에 볼 수 있게 한다.
User-visible outcome: Admin에서 가용성 요약/타임라인을 보고, 엔지니어는 Loki에서 구조화 로그를 조회한다.
Scope / Out of scope: Scope는 summary/timeline API+UI, Loki 수집 파이프라인, Out은 OTEL 분산추적.
Changes: DB(가용성 집계 조회), API(`/api/admin/availability/*`), UI(대시보드), 배치(로그 수집 파이프라인), 로그(label 표준화).
Scope lock:
- [ ] `apps/web/src/services/admin/availability.service.ts`
- [ ] `apps/web/src/app/api/admin/availability/summary/route.ts`
- [ ] `apps/web/src/app/api/admin/availability/timeline/route.ts`
- [ ] `apps/web/src/app/admin/availability/page.tsx`
- [ ] `infra/observability/loki/promtail-config.yml`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "summary": {
      "monitoringCount": 120,
      "availabilityRate": 0.12
    },
    "timeline": [
      {
        "bucket": "2026-02-14T09:00:00Z",
        "available": 3,
        "unavailable": 27
      }
    ]
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- 타임라인 bucket=1h(UTC), UI 표시는 KST 변환.
DoD:
- [ ] 가용성 summary/timeline API와 화면 배포.
- [ ] pino 로그가 Loki로 적재.
- [ ] Grafana 기본 대시보드 1개 생성.
Validation:
- [ ] API 응답과 DB 집계 쿼리 비교.
- [ ] Grafana에서 24시간 로그 조회 확인.
Dependencies/Blockers: `TD-2-T1`.
Estimate_days: 2

#### Ticket `INFRA-T1`
- [ ] 진행완료
Title: DB 자동 백업 + 복구 리허설
Goal: 데이터 손실 리스크를 낮추기 위해 백업/복구 절차를 자동화한다.
User-visible outcome: 운영자가 복구 가능 상태를 점검표로 확인한다.
Scope / Out of scope: Scope는 일 1회 백업 자동화와 월 1회 복구 리허설, Out은 멀티리전 DR.
Changes: DB(백업/복구), API(없음), UI(운영 문서), 배치(cron backup), 로그(백업 성공/실패).
DoD:
- [ ] 자동 백업 스케줄 동작.
- [ ] 복구 리허설 절차 문서화.
- [ ] 백업 무결성 체크 로그 기록.
Validation:
- [ ] 테스트 환경 복구 1회 실행.
- [ ] RTO/RPO 측정값 기록.
Dependencies/Blockers: 스토리지 버킷/권한.
Estimate_days: 1

---

## Epic 5 — Phase 5 비전 실험 (리서치 우선)
summary: 대규모 기능은 구현 전 "정의/데이터/리스크"를 1~2일 실험 티켓으로 먼저 축소한다.  
success_metric: SaaS/B2B/ML/모바일/글로벌 항목별 go/no-go 근거 문서가 생성된다.
- [ ] Progress: 완료

### Story 5.1 — [9.2, 9.4] SaaS/B2B 사업모델 검증
summary: 구독/파트너 API를 바로 구현하지 않고 과금/인증/운영비 가정을 검증한다.  
success_metric: 과금 SoT와 API 인증 모델이 RFC로 확정되고 PoC 엔드포인트가 동작한다.
- [ ] Progress: 완료

#### Ticket `VISION-T1`
- [ ] 진행완료
Title: SaaS/B2B 과금·인증 RFC 작성
Goal: 구독/건당/API 과금 규칙과 인증 경계를 명확히 한다.
User-visible outcome: 경영/운영이 동일한 용어로 가격 정책을 합의한다.
Scope / Out of scope: Scope는 모델/RBAC/API key/요금표 가정, Out은 상용 배포.
Changes: DB(없음), API(없음), UI(없음), 배치(없음), 로그(가정 시뮬레이션 결과).
DoD:
- [ ] 요금 정책 초안과 ARPU 시뮬레이션 포함.
- [ ] API key lifecycle(발급/폐기/회전) 정의.
- [ ] 비용/리스크 섹션 포함.
Validation:
- [ ] 리뷰 미팅 1회 후 승인/보류 결정 기록.
- [ ] 가정값 변경 시 영향표 업데이트.
Dependencies/Blockers: 없음.
Estimate_days: 1

#### Ticket `VISION-T2`
- [ ] 진행완료
Title: B2B API key 인증 + 사용량 계측 PoC
Goal: 파트너 API 최소 엔드포인트 1개를 인증/계측 포함으로 검증한다.
User-visible outcome: 파트너 요청이 API key로 인증되고 사용량이 집계된다.
Scope / Out of scope: Scope는 PoC endpoint/키검증/usage log, Out은 정식 파트너 포털.
Changes: DB(API key/usage log), API(B2B endpoint), UI(간단 usage 조회), 배치(없음), 로그(파트너 호출 메트릭).
Scope lock:
- [ ] `packages/db/prisma/schema.prisma`
- [ ] `apps/web/src/app/api/b2b/monitorings/route.ts`
- [ ] `apps/web/src/services/api-key.service.ts`
- [ ] `apps/web/src/services/usage-meter.service.ts`
- [ ] `apps/web/src/app/api/b2b/monitorings/__tests__/route.test.ts`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "partnerId": "ptn_001",
    "used": 121,
    "limit": 1000,
    "window": "2026-02-14"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- usage는 UTC day window 집계, key별 `count(*)` 계산.
DoD:
- [ ] API key 발급/검증 최소 경로 구현.
- [ ] 호출당 usage log 저장.
- [ ] 일별 호출 수 조회 가능.
Validation:
- [ ] 정상/만료/폐기 키 시나리오 테스트.
- [ ] usage 집계 SQL 결과 확인.
Dependencies/Blockers: `VISION-T1`.
Estimate_days: 2

### Story 5.2 — [9.1, 9.3, 9.6] ML/모바일/글로벌 준비
summary: 장기 기능 구현 전에 데이터 적합성과 확장 설계 리스크를 줄인다.  
success_metric: 모델 학습 가능 데이터셋, 모바일 푸시 계약, 글로벌 로캘/통화 매트릭스가 준비된다.
- [ ] Progress: 완료

#### Ticket `VISION-T3`
- [ ] 진행완료
Title: ML 학습용 데이터 마트 추출 + 백테스트 베이스라인
Goal: 가격/가용성 예측 실험이 가능한 최소 데이터셋을 준비한다.
User-visible outcome: 운영자가 "예측 PoC 가능/불가"를 수치로 확인한다.
Scope / Out of scope: Scope는 데이터 추출 파이프라인+기초 백테스트, Out은 프로덕션 모델 서빙.
Changes: DB(집계 쿼리), API(없음), UI(리포트 문서), 배치(추출 잡), 로그(품질 리포트).
Scope lock:
- [ ] `scripts/data-mart/extract_price_availability.sql`
- [ ] `scripts/backtest/baseline.ts`
- [ ] `scripts/backtest/features.ts`
- [ ] `reports/ml-baseline/2026-02.md`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
DoD:
- [ ] 6개월 학습 테이블 추출 스크립트 작성.
- [ ] 누락률/이상치 리포트 생성.
- [ ] 단순 베이스라인 지표(MAE 등) 산출.
Validation:
- [ ] 샘플 백테스트 재실행 가능 확인.
- [ ] 데이터 품질 리포트 PR 첨부.
Dependencies/Blockers: 데이터 보존 정책 정합.
Estimate_days: 2

#### Ticket `VISION-T4`
- [ ] 진행완료
Title: 모바일 푸시/글로벌 로캘 확장 스파이크
Goal: 모바일 앱/글로벌 확장 전 공통 계약(디바이스 토큰, 통화/시간대)을 정의한다.
User-visible outcome: 로드맵의 글로벌/모바일 항목이 구현 가능한 스펙으로 전환된다.
Scope / Out of scope: Scope는 디바이스 토큰 API PoC, locale-currency-timezone 매트릭스, Out은 앱 출시.
Changes: DB(device token/locale mapping 초안), API(token 등록 PoC), UI(없음), 배치(테스트 푸시 잡), 로그(push success/fail).
Scope lock:
- [ ] `apps/web/src/app/api/devices/token/route.ts`
- [ ] `apps/web/src/services/push-token.service.ts`
- [ ] `scripts/push/test-send.ts`
- [ ] `docs/global/locale-currency-timezone-matrix.md`
Out of scope:
- [ ] 다른 Story의 기능을 동시 구현하지 않는다.
- [ ] 전면 UI 리디자인/문구 재작성은 이번 범위에서 제외한다.
- [ ] 인프라 구조 변경(서버 증설, DB 엔진 교체)은 제외한다.
Interface contract:
Response shape(JSON 예시 1개):
```json
{
  "ok": true,
  "data": {
    "deviceTokenId": "dt_001",
    "platform": "ios",
    "locale": "ko-KR"
  }
}
```
Error shape(표준 에러 1개):
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid request payload",
    "requestId": "req_20260214_001"
  }
}
```
Pagination/aggregation 기준:
- device token은 `(userId, token)` unique, 페이지네이션 없음.
DoD:
- [ ] 디바이스 토큰 등록 API PoC 동작.
- [ ] 국가별 locale/currency/timezone 매트릭스 문서화.
- [ ] 테스트 푸시 발송 결과 기록.
Validation:
- [ ] 토큰 등록/삭제 API 테스트.
- [ ] 푸시 성공률 로그 확인.
Dependencies/Blockers: 푸시 공급자 선택.
Estimate_days: 2

---

## 변경 요약

### (a) 새로 추가/분리된 티켓 목록
- `P0-9b-T1` 추가: 클릭 트래킹 2차(저장형 이벤트 + 퍼널 연동)
- `P0-10-T2b` 추가: PriceQuote active DB 제약 2차 적용(부분 유니크 인덱스)
- `P0-10-T2` 조정: active 정책을 1차 앱 레벨로 제한(일정 리스크 완화)

### (b) Response shape / Scope lock 추가 체크리스트

| Ticket | Response shape 추가 | Scope lock 추가(Estimate=2) |
|---|---|---|
| `P0-9-T1` | — | — |
| `P0-9-T2` | ✅ | ✅ |
| `P0-9-T3` | ✅ | ✅ |
| `P0-9-T4` | ✅ | — |
| `P0-9b-T1` | ✅ | — |
| `P0-10-T1` | — | — |
| `P0-10-T2` | — | — |
| `P0-10-T2b` | — | — |
| `P0-10-T3` | ✅ | ✅ |
| `P0-10-T4` | ✅ | — |
| `TD-1-T1` | ✅ | ✅ |
| `TD-3-T1` | ✅ | — |
| `P1-1-T1` | ✅ | ✅ |
| `P1-2-T1` | ✅ | ✅ |
| `P1-4-T1` | ✅ | ✅ |
| `SEC-4-T1` | ✅ | — |
| `TD-2-T1` | ✅ | ✅ |
| `SEC-1-2-6-T1` | ✅ | — |
| `TEST-P1-T1` | — | ✅ |
| `I18N-APP-T1` | ✅ | ✅ |
| `P2-INTAKE-T1` | — | — |
| `P2-INTAKE-T2` | ✅ | ✅ |
| `P2-INTAKE-T3` | ✅ | ✅ |
| `P2-1-T1` | ✅ | ✅ |
| `PAY-T1` | — | — |
| `PAY-T2` | ✅ | ✅ |
| `PAY-T3` | ✅ | — |
| `API-1-T1` | ✅ | ✅ |
| `IT-T1` | ✅ | ✅ |
| `TD-9-PERF-1-T1` | ✅ | — |
| `P1-5-T1` | ✅ | ✅ |
| `I18N-USER-T1` | ✅ | ✅ |
| `BOOKING-T1` | ✅ | ✅ |
| `DOMESTIC-T1` | — | ✅ |
| `CHANNEL-T1` | ✅ | ✅ |
| `E2E-T1` | ✅ | ✅ |
| `ADMIN-I18N-T1` | ✅ | ✅ |
| `P2-2-T1` | ✅ | ✅ |
| `AVAIL-OBS-T1` | ✅ | ✅ |
| `INFRA-T1` | — | — |
| `VISION-T1` | — | — |
| `VISION-T2` | ✅ | ✅ |
| `VISION-T3` | — | ✅ |
| `VISION-T4` | ✅ | ✅ |

### (c) 가장 먼저 할 Top 5 (의존성/효과 기준)
1. `P0-9-T1`  
이유: P0-9 KPI SoT/기준시각/중복규칙을 문서·SQL·DoD로 고정해 숫자 논쟁을 즉시 종료한다.

2. `P0-9-T2`  
이유: 서버 집계 API가 있어야 UI/시간대/후속 클릭 퍼널(P0-9b)이 병렬로 진행된다.

3. `P0-10-T2`  
이유: PriceQuote 스키마 기반을 먼저 열어야 산식 API/관리 UI를 구현할 수 있다.

4. `P0-10-T3`  
이유: 가격 산식 SoT와 변경 이력을 바로 운영에 적용해 분쟁 리스크를 낮춘다.

5. `TD-2-T1`  
이유: 이후 자동화 배치(P1-1/P1-2/P1-4) 실패 원인 추적을 위해 구조화 로그가 선행되어야 한다.

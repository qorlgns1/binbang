# Binbang Sprint 2 — apps/web 통합 & 베타 준비

> **상태: 완료 (2026-02-26)**
> 기간: 2026-03-09 ~ 2026-03-20 (2주)
> 최종 업데이트: 2026-02-26

---

## Executive Summary

Sprint 1에서 `apps/mooncatch`에 구현된 백엔드 파이프라인(폴링 → 감지 → 알림)을 `**apps/web`으로 이식**하는 것이 Sprint 2의 핵심이다.

**핵심 아키텍처 결정 (2026-02-26)**:

- **"Watch 등록" 개념 없음**: 사용자에게는 "알림 등록"이다. 기존 대시보드 UX 그대로 사용
- `**binbang_watches` 테이블 없음**: 기존 `Accommodation` 테이블에 Agoda API 컬럼 추가
- `**propertyId` 없음**: 기존 `platformId`(String) + `platform = AGODA` 조합으로 충분
- **대시보드 그대로 사용**: 데이터 소스만 교체 (accommodations query에 Agoda API 모니터링 포함)
- **스크래핑은 어드민 격리**: 기존 URL 등록 기능 → `/admin/accommodations`로 이동

**변경된 사용자 플로우**:

```
기존: 이메일 입력 → URL 등록 → 스크래핑 감시
신규: 로그인 → 호텔 검색 (agoda_hotels DB) → 알림 등록 → Agoda API 감시 → 이메일 알림
```

**Sprint 2 완료 기준**:

- `apps/web`에서 로그인한 사용자가 호텔을 검색하고 알림을 등록할 수 있다
- 알림 등록된 호텔이 Agoda API로 폴링되고, 변화 감지 시 이메일이 발송된다
- 기존 URL 등록 기반 스크래핑은 어드민 전용으로 격리된다
- 개발 검증 환경에서 end-to-end 알림 1건 성공

---

## 실행 현황 (2026-02-26)


| 작업 ID    | 상태                             | 산출물                                                                                                                    |
| -------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| W4-D1-T2 | ✅ 완료                           | `apps/web/src/lib/agoda/normalize.ts`, `apps/web/src/services/agoda-polling.service.ts`                                |
| W4-D2-T1 | ✅ 완료                           | `apps/web/src/services/agoda-notification.service.ts` (CTA/수신거부 포함 템플릿 v2)                                             |
| W4-D2-T2 | ✅ 완료                           | `apps/web/src/services/agoda-notification.service.ts` (locale 기반 ko/en 분기)                                             |
| W4-D3-T1 | ✅ 완료                           | `/admin/ops` (`apps/web/src/app/admin/ops/page.tsx`, `apps/web/src/services/admin/ops.service.ts`)                     |
| W4-D3-T2 | ✅ 완료                           | `reports/consent-reconfirm.sql`                                                                                        |
| W4-D4-T1 | ✅ 완료 (Sprint 3 W5-D1에서 인프라 완성) | `docs/deployment/ENVIRONMENTS.md`, `docker/docker-compose.develop.yml`, `apps/web/.env.example` |
| W4-D4-T2 | ✅ 완료                           | `apps/web/src/services/admin/awin.service.ts` (31일 분할 + 20 calls/min)                                                  |
| W4-D5-T1 | ✅ 완료                           | `docs/binbang/beta-onboarding-guide.md`                                                                              |
| W4-D5-T2 | ✅ 완료                           | `reports/daily.sql`                                                                                                    |


참고:

- `development` 인프라는 Sprint 3 W5-D1에서 완성 (`docker/docker-compose.develop.yml`, `apps/web/.env.example`).

---

## 아키텍처 결정 (Sprint 1 → 2 전환)


| 항목     | Sprint 1 (binbang 독립) | Sprint 2 (web 통합)                              |
| ------ | ----------------------- | ---------------------------------------------- |
| 앱 위치   | `apps/mooncatch`      | `**apps/web`**                                 |
| 인증     | 이메일만 (로그인 없음)           | **NextAuth (Google/Kakao/이메일)**                |
| 호텔 탐색  | propertyId 직접 입력        | `**agoda_hotels` DB 검색**                       |
| 사용자 등록 | "Watch 등록"              | **"알림 등록" (기존 대시보드 UX)**                       |
| DB 모델  | `MooncatchWatch` (별도)   | `**Accommodation` 테이블 확장**                     |
| 호텔 식별자 | `propertyId` (BigInt)   | `**platformId` (String) + `platform = AGODA`** |
| 스크래핑   | 일반 사용자 기능               | **어드민 전용 격리**                                  |
| 대시보드   | —                       | **기존 대시보드 그대로 (데이터 소스 교체)**                    |


---

## DB 스키마 변경 계획

기존 `Accommodation` 테이블에 다음을 추가하는 마이그레이션 1개로 해결.

```prisma
model Accommodation {
  // 기존 필드 유지 (url은 nullable로 변경)
  url      String?   // nullable: API 방식엔 불필요, 스크래핑엔 필수

  // 추가 필드 (Agoda API 방식)
  children     Int      @default(0)   // 아동 수
  currency     String   @default("KRW")
  locale       String   @default("ko")
  lastPolledAt DateTime?              // 마지막 Agoda API 폴링 시각
  lastEventAt  DateTime?              // 마지막 가격변동/빈방 이벤트 시각

  // 추가 관계
  pollRuns      PollRun[]
  alertEvents   AlertEvent[]
  notifications AccommodationNotification[]

  // 기존 관계 유지
  checkLogs CheckLog[]
  cases     Case[]
}
```

**platform 구분**:

- `platform = AIRBNB` + `url` 있음 → 스크래핑 (기존, 어드민 전용)
- `platform = AGODA` + `platformId` 있음 → Agoda API 폴링 (신규, 일반 사용자)

`**binbang_*` 테이블**: Sprint 2에서 신규 생성 없음. Sprint 1 데이터는 마이그레이션 또는 폐기.

---

## 주간 목표

### 주3 목표 — apps/web 통합

- **DB 마이그레이션**: `Accommodation`에 Agoda API 컬럼 추가, `url` nullable
- **폴링 서비스 이식**: `polling`, `detector`, `notification` 서비스를 `apps/web`에 추가 (`Accommodation` 기반으로 수정)
- **호텔 검색 API**: `agoda_hotels` 테이블 기반 검색 → 알림 등록 플로우
- **스크래핑 어드민 격리**: 기존 URL 등록 기능을 `/admin/accommodations`로 이동

### 주4 목표 — 베타 준비 & 클릭아웃

- **클릭아웃 퍼널**: 알림 이메일 → `/api/go` redirect → Agoda 예약 페이지
- **landingUrl 확보**: Agoda `metaSearch` extra 실험
- **운영 대시보드**: 오탐/알림 지연/알림 등록 현황 간단 조회
- **개발 검증 배포 + 베타 10명 온보딩**

---

## 일별 세부 작업

### 주3 — apps/web 통합 (Day 11~15)


| Day    | 작업 ID    | 목적                         | 출력                                                 | 검증 기준                                             | 예상  |
| ------ | -------- | -------------------------- | -------------------------------------------------- | ------------------------------------------------- | --- |
| Day 11 | W3-D1-T1 | DB 마이그레이션                  | `url` nullable + Agoda API 컬럼 추가                   | 기존 accommodation 데이터 정상, `platform=AGODA` 조회 가능   | 2h  |
| Day 11 | W3-D1-T2 | 폴링 서비스 이식                  | `apps/web/src/services/agoda-polling.service.ts` 등 | `Accommodation` 기반으로 동작, 기존 유닛 테스트 통과             | 4h  |
| Day 11 | W3-D1-T3 | internal API 라우트 이식        | `apps/web/src/app/api/internal/*`                  | 토큰 인증 + 폴링 응답 정상                                  | 2h  |
| Day 12 | W3-D2-T1 | 호텔 검색 API                  | `GET /api/hotels/search?q=제주`                      | `agoda_hotels`에서 이름/도시 검색, 결과 ≤ 20개               | 3h  |
| Day 12 | W3-D2-T2 | 알림 등록 API                  | `POST /api/accommodations` (Agoda API 방식)          | `platform=AGODA`, `platformId` 저장, `url=null`     | 3h  |
| Day 13 | W3-D3-T1 | 호텔 검색 UI                   | 검색창 + 결과 리스트 컴포넌트                                  | 검색어 입력 → 호텔 카드 → "알림 등록" 버튼                       | 5h  |
| Day 13 | W3-D3-T2 | 대시보드 데이터 통합                | `useAccommodationsQuery` Agoda API 방식 포함           | 대시보드에서 알림 등록 + 스크래핑 항목 함께 표시                      | 3h  |
| Day 14 | W3-D4-T1 | URL 등록 → 어드민 격리            | 기존 URL 등록 UI를 `/admin/accommodations/new`로 이동      | 일반 사용자 라우트에서 URL 등록 폼 제거                          | 3h  |
| Day 14 | W3-D4-T2 | Cron 설정                    | `vercel.json` cron 정의 (→ 이후 BullMQ Repeat Job으로 이관) | 30분마다 `/api/internal/accommodations/poll-due` 호출  | 1h  |
| Day 15 | W3-D5-T1 | remainingRooms Agoda 계정 확인 | Agoda 계정 매니저 서면 질의 또는 API 실험                       | `rateDetail` extra 포함 시 `remainingRooms` 반환 여부 확인 | 2h  |
| Day 15 | W3-D5-T2 | 통합 테스트                     | 알림 등록 → 폴링 → 이메일 발송 e2e                            | console 이메일 모드로 end-to-end 1건 성공                  | 3h  |


### 주4 — 클릭아웃 & 베타 준비 (Day 16~20)


| Day    | 작업 ID    | 목적               | 출력                                    | 검증 기준                                         | 예상  |
| ------ | -------- | ---------------- | ------------------------------------- | --------------------------------------------- | --- |
| Day 16 | W4-D1-T1 | 클릭아웃 API         | `GET /api/go?accommodationId=…&url=…` | clickouts 테이블에 1건 + 302 redirect              | 4h  |
| Day 16 | W4-D1-T2 | landingUrl 확보 실험 | `extra: ['metaSearch']` 스모크 테스트       | landingUrl 필드 존재 시 사용, 없으면 fallback URL 규칙 적용 | 2h  |
| Day 17 | W4-D2-T1 | 이메일 템플릿 개선       | 알림 이메일 v2 (클릭아웃 CTA 포함)               | "가용성 감지" 문구, 예약 이동 버튼, 수신거부 링크                | 3h  |
| Day 17 | W4-D2-T2 | 알림 템플릿 한/영 지원    | locale 기반 템플릿 분기                      | ko/en 각각 한국어/영어 이메일 발송                        | 2h  |
| Day 18 | W4-D3-T1 | 운영 대시보드 (간단)     | `/admin/ops` 페이지                      | 알림 등록 수 / 알림 성공률 / 오탐 후보 쿼리                   | 4h  |
| Day 18 | W4-D3-T2 | 수신동의 재확인 토대      | `consent_logs`에서 2년 경과 대상 추출 쿼리       | 쿼리 작성                                         | 2h  |
| Day 19 | W4-D4-T1 | 개발 검증 배포          | `apps/web` 개발 검증 환경                    | end-to-end 알림 1건 + 클릭아웃 1건 성공                 | 4h  |
| Day 19 | W4-D4-T2 | Awin 연동 (P1 옵션)  | 트랜잭션 조회                               | 31일 범위 분할 조회, 20 calls/min 준수                 | 4h  |
| Day 20 | W4-D5-T1 | 베타 온보딩 (10명)     | 커뮤니티 베타 모집 글 + 온보딩 가이드                | 10명 알림 등록 완료                                  | 3h  |
| Day 20 | W4-D5-T2 | 일일 운영 리포트 SQL    | `reports/daily.sql`                   | 알림 성공률 / 오탐 후보 / 클릭아웃 집계                      | 2h  |


---

## 발견사항 반영 (Sprint 1 → 2)

### ⚠️ remainingRooms 미반환 대응 전략

Sprint 1 테스트에서 Agoda 기본 응답에 `remainingRooms`가 없음을 확인. Sprint 2 주3에 반드시 해결.

**Option A**: ~~Agoda 계정 매니저에 `rateDetail` extra + `remainingRooms` 반환 조건 확인~~ → lt_v1 API에서 영구적으로 미반환 확인 (Sprint 3, 2026-02-26)
**Option B**: `remainingRooms` 대신 `dailyRate` 변화만으로 price_drop 감지 집중 — price_drop은 이 방식으로 정상 동작
**Option C**: ~~응답에서 방 자체의 유무(offer 존재/소멸)로 vacancy proxy 감지~~ → Sprint 3 W5-D3에서 `vacancy_proxy` 타입으로 구현했으나, 안정적 pseudo offerKey로 인해 신규 offerKey 등장이 없어 실제 미발동 확인 → 제거 후 vacancy 로직 자체를 재설계

**최종 결정 (Sprint 3, 2026-02-26)**: Option C 방향을 유지하되 vacancy_proxy 별도 타입 분리 없이 vacancy 감지 로직 자체를 재정의:

- 이전 poll에 스냅샷 없음(sold out) + 현재 poll에 결과 있음 + hasBaseline → vacancy 이벤트
- `vacancy_proxy` 타입 완전 제거
- verify 단계: `remainingRooms > 0` 대신 호텔 결과 존재 여부(`verifyOffers.length > 0`)로 확인
- 자세한 내용은 Sprint 3 문서의 "사후 변경 이력" 참고

### 호텔 검색 UI 설계 원칙

Agoda 계약상 "Price Comparison 사이트"로 해석될 수 있는 UI 금지.

- ✅ 허용: 호텔 이름/도시로 검색 → 알림 등록
- ✅ 허용: 내 알림 등록 호텔의 현재 가격 표시 (자체 폴링 결과)
- ❌ 금지: 타사 OTA와의 가격 비교 노출
- ❌ 금지: 복수 호텔의 실시간 가격 리스트 비교 UI

---

## 테스트 체크리스트


| 영역        | 테스트                               | 합격 기준                         |
| --------- | --------------------------------- | ----------------------------- |
| DB 마이그레이션 | 기존 accommodation 데이터 정상           | url nullable 적용, 기존 레코드 영향 없음 |
| 서비스 이식    | apps/web에서 폴링 유닛 테스트 통과           | 13개 이상 통과                     |
| 호텔 검색     | `agoda_hotels` 검색 결과 반환           | 키워드 매칭, ≤ 20건                 |
| 알림 등록     | `platform=AGODA`, `platformId` 저장 | DB에 정상 저장 확인                  |
| 폴링 연동     | due accommodation 자동 폴링           | poll_runs 레코드 생성              |
| 클릭아웃      | `/api/go` 302 redirect            | clickouts 테이블 1건              |
| 이메일 알림    | 이벤트 발생 시 발송                       | console 또는 Resend 성공          |
| 수신거부      | unsubscribe 토큰으로 opt-out          | consent_logs opt_out 기록       |
| 어드민 격리    | 일반 유저 URL 등록 접근 차단                | 403 또는 라우트 없음                 |
| 개발 검증 e2e  | 알림 등록 → 폴링 → 알림 → 클릭아웃            | 1건 완전 성공                      |


---

## 우선순위별 리스크·대응책


| 우선순위 | 리스크                               | 대응책                                                                                                                                     |
| ---- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| P0   | `url` nullable 마이그레이션 시 기존 데이터 영향 | `url`이 있는 레코드는 그대로, 없는 레코드(AGODA API)만 null 허용                                                                                          |
| P0   | `remainingRooms` 계속 미반환           | ~~price_drop 감지 중심으로 전환, vacancy는 offer 존재/소멸로 proxy~~ → **Sprint 3 해결**: 이전 poll 결과 없음 → 현재 poll 결과 있음으로 vacancy 감지. vacancy_proxy 제거. |
| P0   | Agoda 계약 — "Price Comparison" 해석  | 호텔 검색 UI를 "알림 등록용"으로만 구성, 타사 비교 금지                                                                                                      |
| P1   | 수신동의 없는 사용자에게 광고성 발송              | 알림 등록 시 opt-in 체크박스 필수, consent_logs 기록                                                                                                 |
| P1   | 개발 검증 배포 지연                        | Day 19 전에 env 세팅 완료                                                                                                                     |
| P2   | Awin 레이트리밋 (20/min)               | 일 1회 cron, 31일 분할 조회                                                                                                                    |


---

## Sprint 2 산출물 목록


| 완료 시점 | 산출물                            | 검증 포인트                     |
| ----- | ------------------------------ | -------------------------- |
| W3-D1 | DB 마이그레이션 완료                   | 기존 데이터 정상, Agoda API 컬럼 추가 |
| W3-D1 | apps/web에 폴링 서비스 이식 완료         | 유닛 테스트 통과                  |
| W3-D2 | 호텔 검색 API + 알림 등록 API          | DB 저장 확인                   |
| W3-D3 | 호텔 검색 UI + 대시보드 통합             | 60초 내 알림 등록                |
| W3-D4 | URL 등록 → 어드민 격리 완료             | 일반 유저 접근 차단 확인             |
| W3-D5 | remainingRooms 방향 결정 + e2e 테스트 | 알림 1건 성공                   |
| W4-D1 | 클릭아웃 API + landingUrl 결정       | 302 + DB 기록                |
| W4-D2 | 이메일 템플릿 v2 (한/영)               | 클릭아웃 CTA 포함                |
| W4-D3 | 운영 대시보드 + 수신동의 재확인 쿼리          | 오탐/지연 조회 가능                |
| W4-D4 | 개발 검증 배포 완료                     | end-to-end 1건 성공           |
| W4-D5 | 베타 10명 온보딩                     | 알림 등록 완료 확인                |


---

## Sprint 3 예상 범위 (참고)

- **apps/mooncatch 퇴역**: `apps/web`으로 완전 전환, mooncatch 컨테이너 중단 (Sprint 3에서 완료)
- **SEO**: 숙소 상세 50개 페이지 + sitemap/robots
- **Awin 트랜잭션 동기화** (P1 이월)
- **카카오 알림톡** 검토 (정보성 알림만 가능)
- **탐지 고도화**: cooldown + 이벤트 우선순위 (빈방 > 가격)
- `**apps/travel` 기능 이관** 검토 (AI 채팅, 목적지 가이드)

---

## 사후 변경 이력

### vacancy 감지 로직 재설계 (2026-02-26, Sprint 3)

**배경**: Sprint 2 W3-D5에서 Agoda `lt_v1` API를 직접 호출한 결과, `remainingRooms` 필드가 영구적으로 미반환됨을 확인. Sprint 2에서 예측한 Option A(rateDetail extra로 해결)는 불가능한 것으로 판명.

Sprint 3 W5-D3에서 `vacancy_proxy`(`detectOfferAppearanceEvents`) 타입을 구현했으나, lt_v1 API의 안정적 pseudo offerKey로 인해 신규 offerKey가 등장하지 않아 실제 미발동이 확인됨.

**최종 변경 내용**:


| 항목                 | Sprint 2 설계                    | 실제 구현 (Sprint 3 이후)               |
| ------------------ | ------------------------------ | --------------------------------- |
| vacancy 감지 조건      | `remainingRooms: 0/null → 양수`  | **이전 poll 결과 없음 → 현재 poll 결과 있음** |
| `vacancy_proxy` 타입 | offer 존재/소멸로 proxy 감지 예정       | **제거** (vacancy로 통합)              |
| `hasBaseline` 계산   | `previousSnapshots.length > 0` | `**latestSuccessfulRun != null`** |
| verify 단계          | `remainingRooms > 0` 확인        | **verify 결과에 오퍼 존재 여부**           |


**영향받은 파일**:

- `apps/web/src/services/agoda-detector.service.ts`
- `apps/web/src/services/agoda-polling.service.ts`
- `apps/web/src/services/agoda-notification.service.ts`
- `apps/web/src/services/__tests__/agoda-detector.service.test.ts`
- `apps/web/src/services/__tests__/agoda-polling-cooldown.service.test.ts`

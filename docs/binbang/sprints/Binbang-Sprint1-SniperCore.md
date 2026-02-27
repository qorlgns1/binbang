# Binbang Sprint 1 — SniperCore

> **상태: 백엔드 완료 / apps/web 통합 Sprint 2로 이월**
> 기간: 2026-02-25 ~ 2026-03-07 (2주)
> 최종 업데이트: 2026-02-26

---

## Executive Summary

Sprint 1의 목표는 "빈방(remainingRooms) 변화 감지 → 알림 발송까지의 전체 경로를 최소 단위로 연결해 정확도 측정이 가능한 MVP를 만드는 것"이었다.

**결과**: 백엔드 파이프라인(Watch 생성 → Agoda API 폴링 → 스냅샷 저장 → 변화 감지 → 이메일 알림)이 `apps/binbang`에 구현 완료됐으며, 실제 Agoda API 호출 테스트까지 통과했다.

**아키텍처 결정 (Sprint 1 종료 시점)**: 별도 앱(`apps/binbang`)으로 운영하는 대신, `**apps/web`을 메인 서비스로 개선**하는 방향으로 전환한다. 이유:

- `apps/web`에 인증(Google/Kakao), RBAC, 유저 관리가 이미 완성돼 있음
- `agoda_hotels` 테이블이 공유 DB에 존재 → URL 등록 대신 호텔 검색 등록으로 전환
- 스크래핑 기반 모니터링은 어드민 전용으로 격리
- `apps/binbang`에서 구현한 서비스 로직은 `apps/web`으로 이식

---

## 아키텍처 결정 사항


| 항목               | 기존 계획                 | 변경 결정                                 |
| ---------------- | --------------------- | ------------------------------------- |
| 메인 서비스 앱         | `apps/binbang` (신규) | `**apps/web`** (기존 앱 개선)              |
| 사용자 등록 방식        | 이메일만으로 Watch 생성       | **회원가입 후 호텔 검색 → Watch 등록**           |
| 호텔 탐색            | propertyId 직접 입력      | `**agoda_hotels` DB 검색**              |
| 인증               | 미구현 (이메일 기반)          | **기존 web NextAuth 활용** (Google/Kakao) |
| 스크래핑             | 일반 사용자 기능             | **어드민 전용으로 격리**                       |
| 알림 채널            | 이메일                   | 이메일 유지 (Kakao 알림톡은 Sprint 3+ 검토)      |
| `apps/binbang` | 메인 앱                  | 서비스 로직 출처 → `apps/web`으로 이식 후 퇴역      |


---

## Sprint 1 완료 현황

### 전체 요약


| 영역              | 상태    | 비고                                               |
| --------------- | ----- | ------------------------------------------------ |
| DB 스키마 + 마이그레이션 | ✅ 완료  | `packages/db` 공유 스키마에 적용                         |
| Agoda API 클라이언트 | ✅ 완료  | `searchClient.ts`                                |
| 응답 정규화          | ✅ 완료  | `normalize.ts` (dailyRate 버그 수정 포함)              |
| Watch CRUD API  | ✅ 완료  | `POST/GET /api/watches`, `GET /api/watches/[id]` |
| 폴링 서비스          | ✅ 완료  | `polling.service.ts` (internal API 방식)           |
| 스냅샷 저장          | ✅ 완료  | `room_snapshots` 테이블                             |
| 변화 감지           | ✅ 완료  | `detector.service.ts` (vacancy + price_drop)     |
| 이메일 알림          | ✅ 완료  | `notification.service.ts` + `email.service.ts`   |
| 수신동의/수신거부       | ✅ 완료  | `consent_logs` + unsubscribe 토큰                  |
| 유닛 테스트          | ✅ 완료  | 13개 통과 (detector + normalize + unsubscribe)      |
| UI (Watch 생성 폼) | 📋 미완 | Sprint 2에서 `apps/web`에 구현                        |
| 배포 (스테이징)       | 📋 미완 | Sprint 2 이후                                      |


---

## 작업별 상세 현황


| Day    | 작업 ID  | 목적                        | 상태    | 비고                                                 |
| ------ | ------ | ------------------------- | ----- | -------------------------------------------------- |
| Day 1  | D1-T1  | P0 스펙 고정                  | ✅     | `docs/mvp-week1-2.md` 작성                           |
| Day 1  | D1-T2  | 숙소 50개 seed 수집            | ✅     | `docs/properties.honeymoon.json`                   |
| Day 1  | D1-T3  | Search API 호출 확인          | ✅     | HTTP 200, latency ~300ms 확인                        |
| Day 2  | D2-T1  | DB 스키마 설계                 | ✅     | Prisma schema에 6개 테이블 추가                           |
| Day 2  | D2-T2  | 마이그레이션 적용                 | ✅     | `migrate deploy`로 적용 완료                            |
| Day 2  | D2-T3  | 데이터 보존 정책                 | ✅     | `docs/data-retention.md` 작성                        |
| Day 3  | D3-T1  | Agoda Search API 클라이언트    | ✅     | 파일 기반 credential 제거, env만 사용                       |
| Day 3  | D3-T2  | 응답 파서                     | ✅     | `dailyRate` 경로 추가 수정 포함                            |
| Day 4  | D4-T1  | Watch 생성 API              | ✅     | zod 유효성 검사, 중복 upsert 포함                           |
| Day 4  | D4-T2  | Watch 목록/상태 API           | ✅     | 이메일/userId 필터, lastPolledAt 포함                     |
| Day 4  | D4-T3  | 최소 UI (Watch 생성 폼)        | 📋 미완 | Sprint 2에서 `apps/web`에 구현                          |
| Day 5  | D5-T1  | 워커 스케줄러 (폴링 큐)            | ✅     | Internal API 방식 (`/api/internal/watches/poll-due`) |
| Day 5  | D5-T2  | Search 호출 배치 (≤100)       | ✅     | propertyIds 100개 제한 준수                             |
| Day 6  | D6-T1  | 스냅샷 저장                    | ✅     | raw + 정규화 분리 저장                                    |
| Day 6  | D6-T2  | 가격 필드 저장                  | ✅     | `totalInclusive` (dailyRate 폴백)                    |
| Day 7  | D7-T1  | 변화 감지 (빈방)                | ✅     | `hasBaseline` 패턴으로 첫 폴링 오탐 방지                      |
| Day 7  | D7-T2  | 변화 감지 (가격)                | ✅     | 10% 임계값, `minDropRatio` 설정 가능                      |
| Day 8  | D8-T1  | 이메일 발송 파이프라인              | ✅     | 지수 백오프 재시도 (1/5/30/120/360분)                       |
| Day 8  | D8-T2  | 수신동의/수신거부/로그              | ✅     | opt-in/opt-out + HMAC unsubscribe 토큰               |
| Day 9  | D9-T1  | 오탐 방지 2차 확인 (verify poll) | ✅     | verify 실패 시 try/catch fallback                     |
| Day 9  | D9-T2  | 테스트 (유닛/통합)               | ✅     | 13개 통과, CI 설정 완료                                   |
| Day 10 | D10-T1 | 스테이징 배포                   | 📋 미완 | Sprint 2 이후 (`apps/web`에 이식 후)                     |
| Day 10 | D10-T2 | 운영 체크리스트/대시보드             | ✅     | `docs/runbook.md` 작성                               |


---

## 실제 테스트 결과

### API 엔드포인트 검증 (로컬 환경)


| 테스트 항목                             | 결과                            |
| ---------------------------------- | ----------------------------- |
| Watch 생성 (POST /api/watches)       | ✅ 201 + watch 반환              |
| 중복 Watch → upsert                  | ✅ 200 + `created: false`      |
| 과거 날짜 checkIn                      | ✅ 400 오류                      |
| checkOut < checkIn                 | ✅ 400 오류                      |
| 이메일 형식 오류                          | ✅ 400 + field errors          |
| 내부 API 토큰 인증                       | ✅ 401 (토큰 없음/오류)              |
| 단건 Watch 폴링 (Agoda API)            | ✅ HTTP 200, latency 200~450ms |
| 첫 폴링 = 이벤트 없음 (hasBaseline: false) | ✅ 정상                          |
| 두 번째 폴링 = baseline 비교              | ✅ 정상                          |
| due poll (미폴링 watch 감지)            | ✅ dueCount: 1                 |
| 전체 파이프라인 실행                        | ✅ poll + dispatch 통합          |
| Unsubscribe (유효 토큰)                | ✅ watch inactive + opt_out 로그 |


### DB 상태 (테스트 후)

```
watches: 3 (2 active, 1 inactive)
poll_runs: 5
room_snapshots: 5
alert_events: 0 (가격 변화 없음)
notifications: 0
consent_logs: 4 (opt_in 3, opt_out 1)
```

---

## 발견사항 및 수정

### 🔴 버그 수정 완료


| 버그                          | 원인                                | 수정                                                    |
| --------------------------- | --------------------------------- | ----------------------------------------------------- |
| 첫 폴링 오탐                     | `before == null` → vacancy 즉시 발생  | `hasBaseline` 파라미터 추가; 이전 스냅샷 없으면 감지 안 함              |
| `lastEventAt` price_drop 누락 | vacancy만 조건에 포함                   | `(vacancyInserted > 0 || priceDropInserted > 0)` 로 수정 |
| latency 측정 오류               | `Math.max(apiLatency, totalTime)` | `Date.now() - pipelineStartedAt` 단일 측정                |


### 🟡 개선 완료


| 항목                       | 개선 전                    | 개선 후                                 |
| ------------------------ | ----------------------- | ------------------------------------ |
| N+1 consent 쿼리           | 알림마다 쿼리                 | 배치 pre-fetch (`IN` 쿼리)               |
| N+1 DB 업데이트              | 루프 내 개별 update          | `updateMany` + `$transaction` 배치     |
| 스냅샷 1000행 스캔             | `LIMIT 1000` 전체 로드      | 최신 성공 poll_run의 스냅샷만 조회              |
| verify poll 실패 시 전체 크래시  | 예외 전파                   | try/catch → fallback `confirmed: []` |
| `include` 대신 `select`    | 규칙 위반                   | 모든 Prisma 쿼리 `select` 로 변환           |
| 파일 기반 credential         | `.env.local` 직접 읽기      | `process.env` 만 사용                   |
| normalize `dailyRate` 누락 | `totalInclusive` 경로에 없음 | `dailyRate` 폴백 경로 추가                 |


### ⚠️ 중요 발견: remainingRooms 미반환

**현상**: Agoda API 실제 응답에서 `remainingRooms` 가 null.

**원인**: 기본 검색 응답 포맷에는 `remainingRooms`가 포함되지 않음. Agoda 제휴사 등급 또는 API 버전에 따라 `rateDetail` extra를 요청해도 반환 여부가 다름.

**현재 확인된 실제 응답 필드**:

```json
{
  "hotelId": 12157,
  "dailyRate": 112.83,
  "crossedOutRate": 1000,
  "currency": "USD",
  "roomtypeName": "Semi Detached Beach Villa"
}
```

`roomId`, `ratePlanId`, `remainingRooms` 없음 → ID는 pseudoBigInt로 생성, rooms/price는 null.

**영향(당시)**: 빈방 감지(vacancy event)는 `remainingRooms` 의존 → 당시 API 응답으로는 vacancy 이벤트 발생 불가. 가격 감지(price_drop)는 `dailyRate`로 정상 동작.

**Sprint 2 액션(당시)**: Agoda 계정 매니저에 `rateDetail` extra + `remainingRooms` 반환 조건 확인 요청.

**최종 해결 (Sprint 3 이후, 2026-02-26)**: `remainingRooms`는 lt_v1 API에서 영구적으로 미반환됨을 확인. 호텔의 결과 포함 여부(presence/absence)로 vacancy를 감지하는 방식으로 로직 전환. 자세한 내용은 Sprint 3 문서의 "사후 변경 이력" 참고.

---

## Sprint 2 이월 항목


| 항목                             | 이유                    |
| ------------------------------ | --------------------- |
| `apps/web` 통합 (서비스 이식)         | 아키텍처 결정 변경            |
| 호텔 검색 UI (`agoda_hotels` 활용)   | `apps/web`에 구현        |
| 인증 연동 (NextAuth, Google/Kakao) | `apps/web` 기존 auth 사용 |
| URL 등록 → 호텔 검색 등록 전환           | UX 개선                 |
| 스크래핑 → 어드민 전용 격리               | 아키텍처 결정               |
| ~~`remainingRooms` 반환 문제 해결~~      | ~~Agoda 계정 확인 필요~~ → ✅ Sprint 3에서 vacancy 감지 기준 재설계로 해결 완료 |
| 스테이징 배포                        | `apps/web` 이식 후 진행    |
| 운영 대시보드 (간단)                   | 배포 이후                 |


---

## 전제·가정 (원본 유지)

### 우선순위 P0/P1/P2


| 우선순위 | 항목          | 값                                    | 상태               |
| ---- | ----------- | ------------------------------------ | ---------------- |
| P0   | 타깃 스코프      | 신혼여행 + 목적지 3개 + 숙소 50개               | ✅ seed 완료        |
| P0   | 핵심 데이터 소스   | Agoda Search API                     | ✅ 연동 완료          |
| P0   | 빈방 감지 기준    | ~~`remainingRooms` 변화~~ → 이전 poll 결과 없음 + 현재 poll 결과 있음 (presence/absence) | ✅ Sprint 3 재설계 완료 |
| P0   | 가격 추적 최소 단위 | `dailyRate` (→ `totalInclusive`로 저장) | ✅ 정상 동작 확인       |
| P0   | 폴링 단위       | Watch (숙소ID + 체크인/아웃 + 인원)           | ✅                |
| P0   | 알림 채널       | 이메일                                  | ✅ Resend 연동 완료   |
| P0   | 타임아웃        | Search 30초                           | ✅                |
| P1   | 최소 UI       | Watch 생성 폼                           | 📋 Sprint 2      |
| P2   | Awin 트랜잭션   | 3주차 이후                               | 📋 유지            |
| P2   | SEO 확장      | 3주차 이후                               | 📋 유지            |
| P2   | 카카오 알림톡     | 미지정                                  | 📋 유지            |


### 테스트 체크리스트 최종 상태


| 영역     | 테스트                  | 결과                |
| ------ | -------------------- | ----------------- |
| API 계약 | Authorization 헤더 포함  | ✅                 |
| 응답 필드  | `remainingRooms` 수신  | ⚠️ null (lt_v1 미반환; 감지 로직은 비의존으로 전환 완료)  |
| 제한 준수  | `propertyIds <= 100` | ✅                 |
| 타임아웃   | 30초                  | ✅                 |
| 탐지 로직  | 이전 poll 결과 없음 → 현재 poll 결과 있음 | ✅ (사후 재설계 반영)     |
| 중복 방지  | 동일 after_hash 재알림 금지 | ✅                 |
| 이메일    | 발송 파이프라인             | ✅ (console 모드 확인) |
| 동의/철회  | opt-in/opt-out 로그    | ✅                 |


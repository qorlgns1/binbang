# MoonCatch Sprint 3 — 베타 안정화 & 채널 확장

> **상태: 완료 ✅**
> 기간: 2026-03-23 ~ 2026-04-03 (2주, Day 21~30)
> 최종 업데이트: 2026-02-27

---

## Executive Summary

Sprint 2에서 완성된 Agoda API 폴링 파이프라인을 **운영 품질**으로 끌어올리는 것이 Sprint 3의 목표다.

**핵심 과제**:
- 쿨다운으로 중복 알림 방지 ✅
- `remainingRooms=null` 케이스를 위한 Vacancy Proxy 감지 ✅ (사후 vacancy로 통합)
- 알림 이력 UI로 사용자 투명성 확보 ✅
- 스톨 감지 + 스냅샷 클린업으로 운영 안정성 확보 ✅
- 카카오 직접 메시지 알림 (OAuth, W6) ✅

---

## 아키텍처 결정 사항

| 항목 | 결정 |
|---|---|
| 쿨다운 저장소 | `AgodaAlertEvent.offerKey` 컬럼 + 복합 인덱스 |
| Vacancy Proxy 조건 | ~~신규 offerKey 등장 + `remainingRooms=null` + `hasBaseline=true`~~ → 사후 제거, vacancy로 통합 |
| 스냅샷 보존 기간 | 30일 (env: `MOONCATCH_SNAPSHOT_RETENTION_DAYS`) |
| 스톨 임계값 | 폴링 주기 × 2 |
| apps/mooncatch 퇴역 | **W5 이전에 완료** (Sprint 3 진행 중 처리) |
| 카카오 알림 채널 | 알림톡(비즈니스) 대신 **OAuth 직접 메시지**(나에게 보내기) 채택 — 추가 비용/심사 불필요 |
| 카카오 계정 연동 | `allowDangerousEmailAccountLinking: true` — 이메일 계정에 Kakao 추가 연동 시 세션 유지 |
| 숙소별 threshold | `Accommodation.priceDropThreshold` — null이면 전역 env 적용, 설정 시 우선 |

---

## Sprint 3 완료 기준

- 동일 오퍼에 대해 쿨다운 기간 내 중복 알림이 발생하지 않는다
- ~~`remainingRooms=null`인 신규 오퍼에 대해 vacancy_proxy 알림이 발송된다~~ → 사후 변경: lt_v1 API는 remainingRooms 미제공, vacancy로 통합
- 사용자가 숙소 상세 페이지에서 알림 이력(최근 20건)을 확인할 수 있다
- `/admin/ops`에서 스톨된 숙소 목록을 확인할 수 있다
- 30일 이상 된 poll run/snapshot이 매일 자동으로 정리된다

---

## DB 마이그레이션

### `20260226000001_sprint3_offer_key`
```sql
ALTER TABLE "agoda_alert_events" ADD COLUMN "offerKey" TEXT;
CREATE INDEX "agoda_alert_events_accommodationId_type_offerKey_detectedAt_idx"
  ON "agoda_alert_events"("accommodationId", "type", "offerKey", "detectedAt");
```

---

## W5: 베타 안정화 (Day 21~25)

### W5-D1: 스테이징 인프라 ✅

| Task | 파일 | 상태 |
|---|---|---|
| T1 | `docker/docker-compose.staging.yml` | ✅ |
| T2 | `apps/web/.env.staging.example` | ✅ |
| T3 | `docs/deployment/ENVIRONMENTS.md` 스테이징 행 추가 | ✅ |

### W5-D2: 쿨다운 ✅

**목표**: 동일 오퍼에 대해 일정 기간 내 중복 이벤트/알림 방지

| Task | 파일 | 상태 |
|---|---|---|
| T1 | `schema.prisma` — `AgodaAlertEvent.offerKey String?` + 인덱스 | ✅ |
| T2 | `agoda-polling.service.ts` — `isInCooldown()` + vacancy/price_drop/vacancy_proxy 루프 적용 | ✅ |
| T3 | `agoda-polling-cooldown.service.test.ts` — 4개 테스트 | ✅ |

**env vars**:
- `MOONCATCH_VACANCY_COOLDOWN_HOURS=24` (기본값)
- `MOONCATCH_PRICE_DROP_COOLDOWN_HOURS=6` (기본값)

**쿨다운 쿼리 조건**:
```
agodaAlertEvent.findFirst({
  where: { accommodationId, type, offerKey, status: 'detected', detectedAt: { gte: cooldownFrom } }
})
```

### W5-D3: Vacancy Proxy ✅

**목표**: `remainingRooms=null` 응답에서도 신규 오퍼 등장을 빈방 신호로 감지

| Task | 파일 | 상태 |
|---|---|---|
| T1 | `agoda-detector.service.ts` — `detectOfferAppearanceEvents()` + `VacancyProxyEventCandidate` | ✅ |
| T2 | `agoda-detector.service.test.ts` — 6개 테스트 추가 (총 24개) | ✅ |
| T3 | `agoda-notification.service.ts` — `vacancy_proxy` 이메일 템플릿 (ko/en) | ✅ |

**감지 조건**: 신규 offerKey + `remainingRooms === null` + `hasBaseline === true`

### W5-D4: 알림 이력 UI ✅

**목표**: 사용자가 숙소 상세 페이지에서 알림 수신 이력 확인

| Task | 파일 | 상태 |
|---|---|---|
| T1 | `api/accommodations/[id]/notifications/route.ts` — `GET` 엔드포인트 | ✅ |
| T2 | `agoda-notification-history.service.ts` — 소유권 검증 + 최근 20건 조회 | ✅ |
| T3 | `accommodations/[id]/page.tsx` — 알림 이력 테이블 섹션 | ✅ |

### W5-D5: 헬스모니터링 + Snapshot Cleanup ✅

**목표**: 스톨 감지 대시보드 + 오래된 데이터 자동 정리

| Task | 파일 | 상태 |
|---|---|---|
| T1 | `ops.service.ts` — `fetchStalledAccommodations()` + `AdminOpsSummary.stalled` | ✅ |
| T2 | `admin/ops/page.tsx` — 스톨 섹션 (이름 / 마지막 폴링 / 경과 시간) | ✅ |
| T3 | `api/internal/snapshots/cleanup/route.ts` + `vercel.json` 크론 (`0 3 * * *`) | ✅ |

**스톨 기준**: `lastPolledAt < (now - 2 × POLL_INTERVAL)` 또는 `lastPolledAt=null AND createdAt < (now - POLL_INTERVAL)`

**클린업**: `agodaPollRun.deleteMany({ polledAt < 30일 전 })` → cascade → `agoda_room_snapshots` 삭제

---

## W6: 채널 확장 (Day 26~30)

### W6-D1: 카카오 직접 메시지 알림 ✅

**실제 구현**: 알림톡(비즈니스 채널) 대신 카카오 OAuth 기반 직접 메시지(나에게 보내기)로 구현.

| Task | 파일 | 상태 |
|---|---|---|
| T1 | `lib/auth.ts` — KakaoProvider `allowDangerousEmailAccountLinking: true` + signIn 콜백에서 `saveKakaoTokens` | ✅ |
| T2 | `lib/kakao/sendKakaoMemo.ts` — 카카오 나에게 보내기 API (순수 HTTP, DB 접근 없음) | ✅ |
| T3 | `services/agoda-kakao.service.ts` — 토큰 관리 + 메시지 템플릿 빌더 + 발송 | ✅ |
| T4 | `services/agoda-notification.service.ts` — 이메일 발송 성공 후 카카오 fire-and-forget 추가 | ✅ |
| T5 | `dashboard/DashboardContent.tsx` — `navigate_kakao` CTA: `signOut→signIn` 위험 플로우 → `signIn('kakao')` 연동으로 교체 | ✅ |

**아키텍처 결정**:
- 기존 NextAuth `/api/auth/callback/kakao` redirect URI 재사용 (custom OAuth endpoint 불필요)
- 카카오 발송 실패가 이메일 알림 상태에 영향 없음 (독립 fire-and-forget)
- 토큰 만료 5분 전 자동 refresh (`REFRESH_MARGIN_MS = 300_000`)

### W6-D2: Price Drop 임계값 커스터마이즈 ✅

DB 마이그레이션: `Accommodation.priceDropThreshold Decimal? @db.Decimal(5,4)`

| Task | 파일 | 상태 |
|---|---|---|
| T1 | `schema.prisma` — `priceDropThreshold Decimal?` + migration `20260226173717_add_price_drop_threshold` | ✅ |
| T2 | `api/accommodations/[id]/route.ts` — PATCH 스키마에 `priceDropThreshold(0~1, nullable)` 추가 | ✅ |
| T3 | `agoda-polling.service.ts` — `accommodation.priceDropThreshold` 설정 시 전역 env 대신 우선 적용 | ✅ |

### W6-D3: 스테이징 E2E 검증 ✅

| Task | 파일 | 상태 |
|---|---|---|
| T1 | `apps/web/.env.staging.example` — Sprint 3 쿨다운/스냅샷 env 3종 추가 | ✅ |
| T2 | `scripts/mooncatch/staging-smoke.sh` — W6 기능 항목 추가 (priceDropThreshold PATCH + dispatch 응답 출력) | ✅ |
| T3 | `scripts/mooncatch/local-smoke.sh` — 로컬 dev 서버(port 3000) 대상 즉시 실행 가능한 smoke 스크립트 신규 작성 | ✅ |

---

## 환경 변수 목록 (Sprint 3 추가)

| 변수 | 기본값 | 설명 | 추가 시점 |
|---|---|---|---|
| `MOONCATCH_VACANCY_COOLDOWN_HOURS` | `24` | vacancy 쿨다운 시간 | W5-D2 |
| `MOONCATCH_PRICE_DROP_COOLDOWN_HOURS` | `6` | price_drop 쿨다운 시간 | W5-D2 |
| `MOONCATCH_SNAPSHOT_RETENTION_DAYS` | `30` | 스냅샷 보존 일수 | W5-D5 |
| `MOONCATCH_PRICE_DROP_THRESHOLD` (전역) | `0.1` | 전역 가격 하락 임계값 (숙소별 `priceDropThreshold` 미설정 시) | W6-D2 |

---

## 테스트 카운트

| 시점 | 테스트 수 | 비고 |
|---|---|---|
| Sprint 2 종료 시 | 338개 | |
| W5-D2 (쿨다운 4개 추가) | 342개 | |
| W5-D3 (vacancy_proxy 6개 추가) | 348개 | |
| vacancy 재설계 이후 | 341개 | vacancy_proxy 테스트 제거 + vacancy 재설계로 정리 |
| **Sprint 3 완료** | **341개** | W6 카카오/threshold 추가분 포함 |

---

## 사후 변경 이력

### vacancy 감지 로직 재설계 (2026-02-26)

**배경**: Agoda `lt_v1` API는 `remainingRooms` 필드를 반환하지 않는다. 모든 스냅샷의 `remainingRooms`가 항상 `null`이므로 W5-D3에서 구현한 `detectVacancyEvents`(remainingRooms 0→양수)와 `detectOfferAppearanceEvents`(vacancy_proxy) 모두 실제로 발동되지 않았다.

**변경 사항**:

| 항목 | 이전 | 이후 |
|---|---|---|
| `detectVacancyEvents` 조건 | `remainingRooms: 0/null → 양수` | **이전 poll 결과 없음(sold out) → 현재 poll 결과 있음** |
| `detectOfferAppearanceEvents` | 신규 offerKey + remainingRooms=null 감지 | **제거** (vacancy로 통합) |
| `hasBaseline` 계산 | `previousSnapshots.length > 0` | **`latestSuccessfulRun != null`** |
| `verifyVacancyCandidates` 검증 | `verifyRemainingRooms > 0` | **verify 결과에 오퍼 존재 여부** |
| vacancy 이메일 본문 | "남은 객실: unknown" | "다시 방이 열렸습니다" |

**영향받은 파일**:
- `apps/web/src/services/agoda-detector.service.ts`
- `apps/web/src/services/agoda-polling.service.ts`
- `apps/web/src/services/agoda-notification.service.ts`
- `apps/web/src/services/__tests__/agoda-detector.service.test.ts`
- `apps/web/src/services/__tests__/agoda-polling-cooldown.service.test.ts`

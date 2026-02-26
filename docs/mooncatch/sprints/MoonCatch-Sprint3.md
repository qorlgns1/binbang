# MoonCatch Sprint 3 — 베타 안정화 & 채널 확장

> **상태: 진행 중 (W5-D5-T3 완료)**
> 기간: 2026-03-23 ~ 2026-04-03 (2주, Day 21~30)
> 최종 업데이트: 2026-02-26

---

## Executive Summary

Sprint 2에서 완성된 Agoda API 폴링 파이프라인을 **운영 품질**으로 끌어올리는 것이 Sprint 3의 목표다.

**핵심 과제**:
- 쿨다운으로 중복 알림 방지
- `remainingRooms=null` 케이스를 위한 Vacancy Proxy 감지
- 알림 이력 UI로 사용자 투명성 확보
- 스톨 감지 + 스냅샷 클린업으로 운영 안정성 확보
- 카카오 알림톡 POC (W6)

---

## 아키텍처 결정 사항

| 항목 | 결정 |
|---|---|
| 쿨다운 저장소 | `AgodaAlertEvent.offerKey` 컬럼 + 복합 인덱스 |
| Vacancy Proxy 조건 | 신규 offerKey 등장 + `remainingRooms=null` + `hasBaseline=true` |
| 스냅샷 보존 기간 | 30일 (env: `MOONCATCH_SNAPSHOT_RETENTION_DAYS`) |
| 스톨 임계값 | 폴링 주기 × 2 |
| apps/mooncatch 퇴역 | **W5 이전에 완료** (Sprint 3 진행 중 처리) |

---

## Sprint 3 완료 기준

- 동일 오퍼에 대해 쿨다운 기간 내 중복 알림이 발생하지 않는다
- `remainingRooms=null`인 신규 오퍼에 대해 vacancy_proxy 알림이 발송된다
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

### W6-D1: 카카오 알림톡 POC

| Task | 내용 |
|---|---|
| T1 | 카카오 비즈니스 채널 API 조사 및 템플릿 설계 |
| T2 | `agoda-kakao.service.ts` POC 구현 |
| T3 | notification 채널 `kakao` 추가 + 발송 로직 |

### W6-D2: Price Drop 임계값 커스터마이즈

DB 마이그레이션: `Accommodation.priceDropThreshold Decimal?`

| Task | 내용 |
|---|---|
| T1 | `schema.prisma` — `priceDropThreshold Decimal?` + migration |
| T2 | 숙소 수정 API에 `priceDropThreshold` 파라미터 추가 |
| T3 | `agoda-polling.service.ts` — accommodation별 threshold 적용 |

### W6-D3: 스테이징 E2E 검증

| Task | 내용 |
|---|---|
| T1 | 스테이징 서버 환경 변수 설정 |
| T2 | `scripts/mooncatch/staging-smoke.sh` 실행 |
| T3 | 실제 알림 발송 E2E 확인 |

---

## 환경 변수 목록 (Sprint 3 추가)

| 변수 | 기본값 | 설명 |
|---|---|---|
| `MOONCATCH_VACANCY_COOLDOWN_HOURS` | `24` | vacancy/vacancy_proxy 쿨다운 시간 |
| `MOONCATCH_PRICE_DROP_COOLDOWN_HOURS` | `6` | price_drop 쿨다운 시간 |
| `MOONCATCH_SNAPSHOT_RETENTION_DAYS` | `30` | 스냅샷 보존 일수 |

---

## 테스트 카운트

| Sprint | 테스트 수 |
|---|---|
| Sprint 2 종료 시 | 338개 |
| W5-D2 (쿨다운 4개 추가) | 342개 |
| W5-D3 (vacancy_proxy 6개 추가) | 348개 |
| **Sprint 3 현재** | **348개** |

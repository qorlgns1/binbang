# Binbang Runbook (Sprint 3 기준)

> 최종 업데이트: 2026-02-26

---

## 1) 환경 변수

### 필수
- `DATABASE_URL`
- Agoda 인증: `AGODA_AFFILIATE_SITE_ID` + `AGODA_AFFILIATE_API_KEY`
- `BINBANG_INTERNAL_API_TOKEN`
- `BINBANG_UNSUBSCRIBE_SECRET` (프로덕션 필수)

### 선택
- `BINBANG_EMAIL_PROVIDER` (`console` | `resend`, 기본값: `console`)
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `BINBANG_PUBLIC_BASE_URL`
- `BINBANG_POLL_INTERVAL_MINUTES` (기본값: `30`)
- `BINBANG_PRICE_DROP_THRESHOLD` (기본값: `0.10`, 10%)

### Sprint 3 추가
- `BINBANG_VACANCY_COOLDOWN_HOURS` (기본값: `24`) — vacancy 중복 알림 방지
- `BINBANG_PRICE_DROP_COOLDOWN_HOURS` (기본값: `6`) — price_drop 중복 알림 방지
- `BINBANG_SNAPSHOT_RETENTION_DAYS` (기본값: `30`) — 스냅샷 자동 정리 보존 일수

---

## 2) 운영 실행 순서

1. 알림 등록 생성: `POST /api/accommodations`
2. 단일 숙소 즉시 폴링: `POST /api/internal/accommodations/{id}/poll`
3. Due 숙소 배치 폴링: `POST /api/internal/accommodations/poll-due`
4. 알림 큐 발송: 폴링 cron 내 후처리 또는 별도 dispatch
5. 스냅샷 정리: `POST /api/internal/snapshots/cleanup` (BullMQ Repeat Job 매일 03:00 UTC 자동 실행)

내부 API 토큰 사용 예시:
```bash
# Due 숙소 배치 폴링
curl -X POST "https://yourdomain.com/api/internal/accommodations/poll-due" \
  -H "x-binbang-internal-token: $BINBANG_INTERNAL_API_TOKEN" \
  -H "content-type: application/json" \
  -d '{"limit":20,"concurrency":3}'

# 스냅샷 수동 정리
curl -X POST "https://yourdomain.com/api/internal/snapshots/cleanup" \
  -H "x-binbang-internal-token: $BINBANG_INTERNAL_API_TOKEN"
```

---

## 3) 장애 대응

### Agoda API 장애
- `agoda_poll_runs.status='failed'` 증가 확인
- `agoda_poll_runs.error` 샘플 점검
- API key/siteId/endpoint 재확인

### 이메일 발송 장애
- `agoda_notifications.status='failed'` 증가 확인
- `agoda_notifications.attempt` 백오프 진행 확인
- provider 설정값/키 점검 (`BINBANG_EMAIL_PROVIDER`, `RESEND_API_KEY`)

### 스톨(Stall) 감지
- `/admin/ops` 페이지 > "폴링 지연 숙소" 섹션 확인
- 기준: `lastPolledAt < now - 2 × POLL_INTERVAL` 또는 `lastPolledAt=null AND createdAt < stallThreshold`
- 원인 확인: Agoda API 오류 / 서버 장애 / cron 중단

---

## 4) 롤백

1. 스케줄러 호출 중단 (Worker BullMQ scheduler 제거 또는 Worker 중단)
2. 내부 API 호출 중단
3. 웹 앱 이전 안정 버전으로 롤백
4. DB는 additive migration 기준이므로 데이터 유지

---

## 5) 운영 점검 SQL

운영 SQL 아티팩트:
- `reports/daily.sql` (일일 운영 리포트: 알림 성공률/오탐 후보/클릭아웃)
- `reports/consent-reconfirm.sql` (2년 경과 수신동의 재확인 대상)

운영 화면:
- `/admin/ops` (알림 등록 수/성공률/오탐 후보/스톨 감지)

```sql
-- 최근 24시간 poll 성공/실패
SELECT status, COUNT(*)
FROM agoda_poll_runs
WHERE polled_at >= NOW() - INTERVAL '24 hours'
GROUP BY status;

-- 최근 24시간 이벤트 타입별 건수
SELECT type, status, COUNT(*)
FROM agoda_alert_events
WHERE detected_at >= NOW() - INTERVAL '24 hours'
GROUP BY type, status
ORDER BY type, status;

-- 알림 큐 상태
SELECT status, COUNT(*)
FROM agoda_notifications
GROUP BY status
ORDER BY status;

-- verify 실패(오탐 후보)
SELECT COUNT(*) AS rejected_verify_failed
FROM agoda_alert_events
WHERE type = 'vacancy'
  AND status = 'rejected_verify_failed'
  AND detected_at >= NOW() - INTERVAL '24 hours';

-- 쿨다운으로 스킵된 이벤트 확인
SELECT type, offer_key, detected_at
FROM agoda_alert_events
WHERE status = 'skipped_cooldown'
  AND detected_at >= NOW() - INTERVAL '24 hours'
ORDER BY detected_at DESC;

-- 미탐 후보: vacancy 이벤트가 발생했으나 직전 poll에 스냅샷이 있었던 경우 (의도치 않은 감지)
-- (참고: lt_v1 API는 remainingRooms를 반환하지 않으므로 remaining_rooms 기반 쿼리는 무의미)
SELECT e.id, e.accommodation_id, e.offer_key, e.detected_at, e.status
FROM agoda_alert_events e
WHERE e.type = 'vacancy'
  AND e.status = 'detected'
  AND e.detected_at >= NOW() - INTERVAL '24 hours'
ORDER BY e.detected_at DESC;

-- 스냅샷 보존 현황 (정리 전 확인용)
SELECT
  DATE(polled_at) AS poll_date,
  COUNT(*) AS poll_runs,
  SUM(snapshot_count) AS snapshots
FROM (
  SELECT polled_at, COUNT(s.id) AS snapshot_count
  FROM agoda_poll_runs r
  LEFT JOIN agoda_room_snapshots s ON s.poll_run_id = r.id
  GROUP BY r.id, r.polled_at
) sub
GROUP BY DATE(polled_at)
ORDER BY poll_date DESC
LIMIT 40;
```

# Binbang Data Retention

## 목적
- 스냅샷/이벤트 데이터를 운영 디버깅에 충분히 남기되, 저장 비용을 통제한다.

## 기본 보관 정책

| 테이블 | 보관 기간 | 비고 |
|---|---|---|
| `agoda_poll_runs` | 90일 | 폴링 히스토리 |
| `agoda_room_snapshots` | 30일 | raw JSON 포함, 정리 BullMQ Repeat Job 매일 03:00 UTC 자동 실행 |
| `agoda_alert_events` | 180일 | 이벤트 감지 이력 |
| `agoda_notifications` | 180일 | 발송 이력 |
| `agoda_consent_logs` | 최소 2년 | 컴플라이언스 로그 |

## 정리 기준
- 일 단위 배치 정리(UTC 03:00 권장)
- soft-delete 대신 hard-delete 기준
- 삭제 전 요약 집계 테이블(향후)로 이관 가능

## 스냅샷 자동 정리
`POST /api/internal/snapshots/cleanup`이 BullMQ Repeat Job으로 매일 03:00 UTC에 자동 실행된다.
보존 일수는 `BINBANG_SNAPSHOT_RETENTION_DAYS` 환경 변수로 조정 가능 (기본값: 30).

## 삭제 SQL 예시
```sql
-- agoda_poll_runs 90일 초과 삭제
DELETE FROM agoda_poll_runs
WHERE polled_at < NOW() - INTERVAL '90 days';

-- agoda_room_snapshots 30일 초과 삭제
DELETE FROM agoda_room_snapshots
WHERE created_at < NOW() - INTERVAL '30 days';

-- agoda_notifications 180일 초과 삭제
DELETE FROM agoda_notifications
WHERE created_at < NOW() - INTERVAL '180 days';

-- agoda_alert_events 180일 초과 삭제
DELETE FROM agoda_alert_events
WHERE detected_at < NOW() - INTERVAL '180 days';
```

## 운영 주의
- `agoda_consent_logs`는 삭제 주기를 공격적으로 가져가지 않는다.
- `agoda_room_snapshots` 삭제 전, 오탐/미탐 분석이 필요한 최소 기간(최근 30일)을 유지한다.

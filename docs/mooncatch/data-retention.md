# Mooncatch Data Retention (Sprint 1)

## 목적
- 스냅샷/이벤트 데이터를 운영 디버깅에 충분히 남기되, 저장 비용을 통제한다.

## 기본 보관 정책
- `poll_runs`: 90일
- `room_snapshots`: 30일 (raw JSON 포함)
- `alert_events`: 180일
- `notifications`: 180일
- `consent_logs`: 최소 2년 (컴플라이언스 로그)

## 정리 기준
- 일 단위 배치 정리(UTC 03:00 권장)
- soft-delete 대신 hard-delete 기준
- 삭제 전 요약 집계 테이블(향후)로 이관 가능

## 삭제 SQL 예시
```sql
-- poll_runs 90일 초과 삭제
delete from poll_runs
where polled_at < now() - interval '90 days';

-- room_snapshots 30일 초과 삭제
delete from room_snapshots
where created_at < now() - interval '30 days';

-- notifications 180일 초과 삭제
delete from notifications
where created_at < now() - interval '180 days';

-- alert_events 180일 초과 삭제
delete from alert_events
where detected_at < now() - interval '180 days';
```

## 운영 주의
- `consent_logs`는 삭제 주기를 공격적으로 가져가지 않는다.
- `room_snapshots` 삭제 전, 오탐/미탐 분석이 필요한 최소 기간(최근 30일)을 유지한다.

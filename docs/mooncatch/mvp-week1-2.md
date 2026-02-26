# Mooncatch MVP Week1-2 Scope

> **[역사 문서]** Sprint 1 (2026-01 ~ 2026-02 초) 당시 작성된 기획/완료 기록입니다.
> 이후 Sprint 2에서 `apps/web`으로 통합, Sprint 3에서 베타 안정화 완료.
> 현재 시스템 상태는 `docs/mooncatch/sprints/MoonCatch-Sprint3.md` 참조.

---

## 목적
- 신혼여행 숙소 `빈방 감지 -> 알림` 경로를 가장 작은 단위로 연결한다.
- 스프린트 1 성공 기준을 "기능 수"가 아니라 "탐지 품질 측정 가능 상태"로 둔다.

## P0 범위
- `POST /api/watches`: 숙소/날짜/인원 기준 Watch 생성(중복 시 재사용)
- `GET /api/watches/[id]`: 최신 상태 조회(`latestPollRun`, `latestAlertEvent`)
- DB 기본 테이블: `watches`, `poll_runs`, `room_snapshots`, `alert_events`, `notifications`, `consent_logs`
- Agoda Search 클라이언트 기본 규칙:
  - `Authorization: siteId:apikey`
  - `propertyIds <= 100`
  - 기본 타임아웃 30초
  - `rateDetail` extra 강제(`remainingRooms` 수집 대비)

## 이벤트 정의(v0)
- `vacancy` 이벤트: 동일 offer에서 `remainingRooms`가 `0/null -> 양수`로 전환될 때 생성.
- dedupe 키: `eventKey`(after hash 포함) unique.
- 오탐 후보: 이벤트 생성 후 verify poll에서 가용성 재확인 실패.

## 품질 지표(v0)
- 오탐률(False Positive): verify fail / vacancy event
- 미탐률(False Negative): 스냅샷 상 가용성 존재 but vacancy event 미생성
- 알림 지연: `event.detectedAt -> notification.sentAt`

## Sprint 1에서 완료한 항목
- Mooncatch 전용 Prisma 모델 + SQL migration 추가
- Watch service + API route + 홈 화면 Watch 생성 폼 추가
- Agoda Search client scaffold 추가(요청 제약/기본값/타임아웃 반영)
- Agoda 응답 normalize + vacancy detector 구현 및 테스트 추가
- `pollMooncatchWatchOnce` 구현(`poll_runs`, `room_snapshots`, `alert_events` 적재)
- 수동 실행용 `POST /api/internal/watches/[id]/poll` 라우트 추가
- due watch 배치 실행(`findDueWatchIds`, `pollDueWatchesOnce`, `/api/internal/watches/poll-due`)
- verify poll 기반 vacancy 확정/기각(`rejected_verify_failed` 상태 기록)
- price-drop detector(임계값 기반) 추가
- notification queue 생성 및 dispatcher(`/api/internal/notifications/dispatch`)
- 통합 운영 엔드포인트(`/api/internal/pipeline/run`) 추가
- unsubscribe 토큰/URL + `GET /api/unsubscribe` 처리 추가
- 운영 문서(`data-retention.md`, `runbook.md`) 추가

## Sprint 1 이후 이어진 작업 (완료)

Sprint 1에서 제시한 "다음 작업"은 이후 Sprint에서 모두 구현되었습니다:

| Sprint 1 과제 | 완료 시점 | 내용 |
|---|---|---|
| cron/queue로 폴링 주기 실행 | Sprint 2 | Vercel Cron `*/30 * * * *` → `poll-due` + `dispatch` |
| verify poll cooldown/지연 재확인 | Sprint 2 | verify re-check + Sprint 3에서 쿨다운(24h/6h) 추가 |
| price-drop 기준 고도화 | Sprint 2 | Snapshot 기반 비교, `MOONCATCH_PRICE_DROP_THRESHOLD` env |

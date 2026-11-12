# Operations Runbook

> **Status: CURRENT — Source of Truth (장애 대응)**
> `CLAUDE.md` 규약상 서버/배포 변경 제안 전 반드시 읽는다.

Last verified: 2026-04-17
Owner: binbang

## 1) Incident Levels
- P1: full outage, persistent 5xx, or severe data integrity risk
- P2: major feature degradation with workaround
- P3: non-critical issue or partial degradation

## 2) Triage Workflow
1. Confirm scope (prod/dev, web/worker/db)
2. Declare incident in ops channel (`github:issues`)
3. Assign roles: commander, operator, scribe
4. Stabilize first (rollback/restart/scale)
5. Identify root cause and implement durable fix
6. Record timeline + follow-up tasks

## 3) Quick Checks
### Production
```bash
curl -fsS https://binbang.moodybeard.com/api/health

docker compose -f docker/docker-compose.production.yml \
  --env-file .env.production --env-file .env.deploy.production \
  ps

docker compose -f docker/docker-compose.production.yml \
  --env-file .env.production --env-file .env.deploy.production \
  logs --tail 200 web worker redis
```

### Development
```bash
curl -fsS https://dev-binbang.moodybeard.com/api/health

docker compose -p binbang-dev -f docker/docker-compose.develop.yml \
  --env-file .env.development --env-file .env.deploy.development \
  ps

docker compose -p binbang-dev -f docker/docker-compose.develop.yml \
  --env-file .env.development --env-file .env.deploy.development \
  logs --tail 200 web worker redis
```

### 빈방 알림 경로 점검
- **배포 직후 자가 진단:** `deploy.yml`이 `up -d` 뒤에 web 컨테이너 안에서 `POST /api/internal/self-test/notifications`를 호출한다. 감지 이벤트와 알림 대기열 저장을 트랜잭션 안에서 해 보고 롤백한다. 실패하면 배포가 실패로 표시된다. 수동으로 돌릴 때도 같은 엔드포인트를 내부 토큰(`x-binbang-internal-token`)과 함께 호출한다.
- **누락 감시:** 워커가 매시 45분에 `POST /api/internal/accommodations/notifications/watchdog`를 호출한다. 30~90분 전에 감지됐는데 `agoda_notifications` 행이 없는 이벤트가 있으면, `ADMIN` 역할 사용자에게 경보 메일을 보낸다. 어드민 BullMQ 화면에서 `binbang-notification-watchdog-scheduler`를 즉시 실행할 수도 있다.
- 경보를 받으면 운영 web 로그에서 `agoda_notification_enqueue_failed`를 찾는다.

## 4) Common Failure Scenarios
### A) App does not boot
- Check `.env.<APP_ENV>` completeness (`ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_CONNECT_STRING`, auth vars 등)
- Check `.env.deploy.<APP_ENV>` — IMAGE_TAG, DIGEST 값이 유효한지 확인
- Check Next.js/web logs for env validation errors

### B) Elevated 5xx
- Confirm latest deploy SHA (`DEPLOY_SHA` in `.env.deploy.<APP_ENV>`) and diff scope
- Check DB connectivity and migration state
- Roll back to previous known-good digests if regression suspected

### C) Queue backlog growth
- Confirm worker is running and connected to Redis
- Inspect worker logs for Playwright/platform-selector failures
- Restart worker service and re-check queue processing

### D) Migration-related errors
- Validate TypeORM migration status (`pnpm db:migrate:deploy` 재실행 시 pending 목록 확인)
- Stop rollout, apply fix-forward or rollback decision
- Shared Agoda catalog(`agoda_hotels`, `agoda_hotels_search`)는 `BINBANG_SHARED` 스키마이므로 application migration으로 복구되지 않는다. 스키마 이상 시 `packages/db/sql/agoda_shared_catalog.sql` 재적용 여부를 먼저 확인한다.
- Re-run health checks before traffic stabilization message

## 5) Recovery Playbooks
### Rollback (production)
1. `.env.deploy.production`에서 `IMAGE_TAG` / `IMAGE_*_DIGEST`를 이전 값으로 수정
2. Pull and redeploy compose stack
3. Verify `/api/health` and key user flow

```bash
# .env.deploy.production 수정 후:
docker compose -f docker/docker-compose.production.yml \
  --env-file .env.production \
  --env-file .env.deploy.production \
  pull

docker compose -f docker/docker-compose.production.yml \
  --env-file .env.production \
  --env-file .env.deploy.production \
  up -d
```

### Restart only
```bash
# production
docker compose -f docker/docker-compose.production.yml \
  --env-file .env.production --env-file .env.deploy.production \
  restart web worker

# development
docker compose -p binbang-dev -f docker/docker-compose.develop.yml \
  --env-file .env.development --env-file .env.deploy.development \
  restart web worker
```

### DB migration rerun (host env)

값 주입은 바깥의 `doppler run`이 담당한다. `with-env`는 `APP_ENV`가 설정돼 있으면
명령을 그대로 넘기므로, 감싸지 않으면 DB 접속 정보가 비어 있다.

```bash
# production / development 모두 해당 환경의 서비스 토큰을 사용한다
doppler run --token "$DOPPLER_TOKEN_WEB" -- pnpm db:migrate:deploy
```

## 6) Observability Links
- Public health: `https://binbang.moodybeard.com/api/health`
- Dev health: `https://dev-binbang.moodybeard.com/api/health`
- Admin heartbeat: `/api/health/heartbeat` (admin auth required)
- Metrics/traces dashboard: metrics=`https://binbang.moodybeard.com/admin/monitoring`, `https://binbang.moodybeard.com/admin/throughput`, `https://binbang.moodybeard.com/admin/heartbeat`; traces=`없음`

## 7) Communication Templates
### Incident start
"Investigating <service/component> issue on <env>. Scope: <impact>. Next update in 15 minutes."

### Incident resolved
"Resolved at <time UTC>. Root cause: <summary>. Follow-up items: <ticket/link>."

## 8) Ownership and Escalation
- Primary on-call: `KIHOON BAE`
- Secondary on-call: `없음`
- Escalation path: `github:issues -> KIHOON BAE`
- Vendor/infra support contacts: `github:issues`

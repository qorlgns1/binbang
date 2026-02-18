# Operations Runbook

Last verified: 2026-02-18
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

## 4) Common Failure Scenarios
### A) App does not boot
- Check `.env.<APP_ENV>` completeness (`DATABASE_URL`, auth vars 등)
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
- Validate Prisma migration status
- Stop rollout, apply fix-forward or rollback decision
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
```bash
# production
APP_ENV=production pnpm db:migrate:deploy

# development
APP_ENV=development pnpm db:migrate:deploy
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

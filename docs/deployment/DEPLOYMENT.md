# Deployment Guide

Last verified: 2026-02-15
Owner: binbang

## 1) Service Overview
- Service name: `binbang`
- Purpose: Airbnb/Agoda accommodation availability monitoring and notification service
- Main users: end-users (monitoring), admins (operations)
- Criticality tier: high

## 2) Architecture Snapshot
- Runtime: Node.js `24.x`, pnpm `10.28.0`
- Hosting: OCI VM + Docker Compose + Nginx reverse proxy
- Components:
  - Web/API: `apps/web` (Next.js 15)
  - Worker: `apps/worker` + `packages/worker-shared` (BullMQ/Playwright)
  - Travel: `apps/travel` (Next.js 15, AI SDK v6, Gemini)
  - Scheduler/Cron: worker runtime scheduler (BullMQ)
- Data stores:
  - Primary DB: PostgreSQL (`DATABASE_URL`)
  - Cache/queue: Redis 7 (`REDIS_URL`)
  - Object storage: 사용 안 함
- Network edge:
  - DNS/TLS: `binbang.moodybeard.com`, `dev-binbang.moodybeard.com`, `travel.moodybeard.com`, `dev-travel.moodybeard.com` + Let's Encrypt
  - Reverse proxy: Nginx (`/home/ubuntu/workspace/reverse-proxy/nginx/conf.d/*.conf`)
  - Nginx config templates: `docker/nginx/*.conf`

## 3) Deployment Flow (Source of Truth)
Based on `.github/workflows/deploy.yml`.

1. Trigger: push to `main` or `develop`
2. Validate: reusable CI (`lint`, `format:check`, `test`, `build`)
3. Build/Push images: Docker Bake to Docker Hub
   - `main` -> `kihoonbae/binbang:web-main`, `worker-main`
   - `develop` -> `kihoonbae/binbang:web-develop`, `worker-develop`
4. Deploy via SSH to OCI host
5. Run Prisma migrate/generate (+ seed)
6. Start/update compose services

## 4) Standard Deploy Procedure
### Production (`main`)
```bash
cd ~/workspace/binbang
git fetch origin main
git checkout -B main origin/main
git reset --hard origin/main

docker compose -f docker/docker-compose.production.yml --env-file .env.production pull
pnpm with-env:production:host pnpm --filter @workspace/db exec prisma migrate deploy
pnpm with-env:production:host pnpm --filter @workspace/db exec prisma generate
pnpm with-env:production:host pnpm --filter @workspace/db exec tsx prisma/seed-base.ts
docker compose -f docker/docker-compose.production.yml --env-file .env.production up -d
```

### Development (`develop`)
```bash
cd ~/workspace/binbang
git fetch origin develop
git checkout -B develop origin/develop
git reset --hard origin/develop

docker compose -p binbang-dev -f docker/docker-compose.develop.yml --env-file .env.development pull
pnpm with-env:development:host pnpm --filter @workspace/db exec prisma migrate deploy
pnpm with-env:development:host pnpm --filter @workspace/db exec prisma generate
pnpm with-env:development:host pnpm --filter @workspace/db exec tsx prisma/seed-base.ts
pnpm with-env:development:host pnpm --filter @workspace/db db:seed
docker compose -p binbang-dev -f docker/docker-compose.develop.yml --env-file .env.development up -d
```

## 5) Database Migration Policy
- Migration tool: Prisma Migrate
- **On OCI host** (this document’s procedure): `pnpm with-env:production:host pnpm --filter @workspace/db exec prisma migrate deploy` — loads `.env.production.local` and `.env.production`.
- **Alternative (no .local)**: 루트에서 `APP_ENV=production pnpm db:migrate:deploy`는 `.env.production`만 사용합니다. 서버에 `.env.production.local`이 있으면 위 `with-env:production:host` 명령을 사용하세요.
- Timing: before final `compose up -d`
- Compatibility: maintain backward-compatible schema for rolling restart windows
- Prohibited flow: `prisma db push` (repo rule)

## 6) Health Checks and Verification
- Public health endpoint:
  - Production: `https://binbang.moodybeard.com/api/health`
  - Development: `https://dev-binbang.moodybeard.com/api/health`
- Travel app:
  - Production: `https://travel.moodybeard.com`
  - Development: `https://dev-travel.moodybeard.com`
- Admin heartbeat endpoint (requires admin session): `/api/health/heartbeat`
- Container checks:
```bash
docker compose -f docker/docker-compose.production.yml --env-file .env.production ps
docker compose -f docker/docker-compose.production.yml --env-file .env.production logs --tail 200 web worker
```

## 7) Rollback Procedure
1. Identify last known good deploy SHA/image digests
2. Update `.env.production` (`IMAGE_TAG`, `IMAGE_WEB_DIGEST`, `IMAGE_WORKER_DIGEST`) to previous values
3. Re-run production pull + `up -d`
4. Re-verify `/api/health` and critical user flows

### Rollback Commands
```bash
# Set previous image digests in .env.production first
docker compose -f docker/docker-compose.production.yml --env-file .env.production pull
docker compose -f docker/docker-compose.production.yml --env-file .env.production up -d
```

## 8) Secrets and Configuration
- CI/CD secrets: GitHub Actions Secrets (`DOCKERHUB_*`, `OCI_*`, `RELEASE_TAG_PAT`)
- CI/CD variables: GitHub Actions Variables (`NEXT_PUBLIC_*`)
- Runtime env files on server:
  - `.env.production`, `.env.production.local`
  - `.env.development`, `.env.development.local`
- Rule: never store secret values in markdown docs or prompts

## 9) Observability and Alerts
- Health APIs: `/api/health`, `/api/health/heartbeat`
- Logs: Docker logs (`web`, `worker`, `redis`)
- Metrics/trace dashboard: `https://binbang.moodybeard.com/admin/monitoring`, `https://binbang.moodybeard.com/admin/throughput`, `https://binbang.moodybeard.com/admin/heartbeat` (trace dashboard 없음)
- Incident channel and on-call routing: `github:issues`

## 10) Ownership
- Repo: `qorlgns1/binbang`
- Service owner/on-call: `KIHOON BAE`

## 11) Change History
- 2026-02-15: initial structured deployment document created

# Deployment Guide

Last verified: 2026-02-18
Owner: binbang

## 1) Service Overview
- Service name: `binbang`
- Purpose: Airbnb/Agoda accommodation availability monitoring and notification service
- Main users: end-users (monitoring), admins (operations)
- Criticality tier: high

## 2) Architecture Snapshot
- Runtime: Node.js `24.x`, pnpm `10.30.2`
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
5. Write image digests + deploy metadata to `.env.deploy.<APP_ENV>`
6. Run Prisma migrate/generate (+ seed)
7. Start/update compose services

## 4) Env File Structure (Server)
서버에는 환경별로 두 파일이 존재한다.

| 파일 | 역할 | 관리 주체 |
|---|---|---|
| `.env.production` | 런타임 설정 (DB URL, secrets, OAuth 등) | 수동 관리 |
| `.env.production.local` | 서버 로컬 오버라이드 (선택) | 수동 관리 |
| `.env.deploy.production` | 배포 메타데이터 (IMAGE_TAG, DIGEST, DEPLOY_SHA 등) | CI/CD 자동 기록 |
| `.env.development` | 개발 환경 런타임 설정 | 수동 관리 |
| `.env.development.local` | 개발 서버 로컬 오버라이드 (선택) | 수동 관리 |
| `.env.deploy.development` | 개발 배포 메타데이터 | CI/CD 자동 기록 |

Docker Compose는 `--env-file` 나중 파일이 이기므로 `.env.deploy.<env>`를 마지막에 로드해 IMAGE_TAG/DIGEST를 항상 최신으로 유지한다.

## 5) Standard Deploy Procedure
### Production (`main`)
```bash
cd ~/workspace/binbang
git fetch origin main
git checkout -B main origin/main
git reset --hard origin/main

docker compose -f docker/docker-compose.production.yml \
  --env-file .env.production \
  --env-file .env.deploy.production \
  pull

APP_ENV=production pnpm db:migrate:deploy
APP_ENV=production pnpm with-env pnpm --filter @workspace/db exec prisma generate
APP_ENV=production pnpm db:seed:base

docker compose -f docker/docker-compose.production.yml \
  --env-file .env.production \
  --env-file .env.deploy.production \
  up -d
```

### Development (`develop`)
```bash
cd ~/workspace/binbang
git fetch origin develop
git checkout -B develop origin/develop
git reset --hard origin/develop

docker compose -p binbang-dev -f docker/docker-compose.develop.yml \
  --env-file .env.development \
  --env-file .env.deploy.development \
  pull

APP_ENV=development pnpm db:migrate:deploy
APP_ENV=development pnpm with-env pnpm --filter @workspace/db exec prisma generate
APP_ENV=development pnpm db:seed:base
APP_ENV=development pnpm with-env pnpm --filter @workspace/db db:seed

docker compose -p binbang-dev -f docker/docker-compose.develop.yml \
  --env-file .env.development \
  --env-file .env.deploy.development \
  up -d
```

## 6) Database Migration Policy
- Migration tool: Prisma Migrate
- **On OCI host**: `APP_ENV=production pnpm db:migrate:deploy` — `with-env`를 통해 `.env.production.local`과 `.env.production`을 로드한다.
- Timing: before final `compose up -d`
- Compatibility: maintain backward-compatible schema for rolling restart windows
- Prohibited flow: `prisma db push` (repo rule)

## 7) Health Checks and Verification
- Public health endpoint:
  - Production: `https://binbang.moodybeard.com/api/health`
  - Development: `https://dev-binbang.moodybeard.com/api/health`
- Travel app:
  - Production: `https://travel.moodybeard.com`
  - Development: `https://dev-travel.moodybeard.com`
- Admin heartbeat endpoint (requires admin session): `/api/health/heartbeat`
- Container checks:
```bash
# production
docker compose -f docker/docker-compose.production.yml \
  --env-file .env.production --env-file .env.deploy.production \
  ps

docker compose -f docker/docker-compose.production.yml \
  --env-file .env.production --env-file .env.deploy.production \
  logs --tail 200 web worker

# development
docker compose -p binbang-dev -f docker/docker-compose.develop.yml \
  --env-file .env.development --env-file .env.deploy.development \
  ps
```

## 8) Rollback Procedure
1. Identify last known good deploy SHA/image digests
2. Update `.env.deploy.production` (`IMAGE_TAG`, `IMAGE_WEB_DIGEST`, `IMAGE_WORKER_DIGEST`, `IMAGE_TRAVEL_DIGEST`) to previous values
3. Re-run production pull + `up -d`
4. Re-verify `/api/health` and critical user flows

### Rollback Commands
```bash
# .env.deploy.production에서 IMAGE_TAG / IMAGE_*_DIGEST를 이전 값으로 수정한 뒤:
docker compose -f docker/docker-compose.production.yml \
  --env-file .env.production \
  --env-file .env.deploy.production \
  pull

docker compose -f docker/docker-compose.production.yml \
  --env-file .env.production \
  --env-file .env.deploy.production \
  up -d
```

## 9) Secrets and Configuration
- CI/CD secrets: GitHub Actions Secrets (`DOCKERHUB_*`, `OCI_*`, `RELEASE_TAG_PAT`)
- CI/CD variables: GitHub Actions Variables (`NEXT_PUBLIC_*`)
- Runtime env files on server:
  - `.env.production`, `.env.production.local`
  - `.env.deploy.production` (CI/CD 자동 기록 — IMAGE_TAG, DIGEST, DEPLOY_SHA 등)
  - `.env.development`, `.env.development.local`
  - `.env.deploy.development` (CI/CD 자동 기록)
- Rule: never store secret values in markdown docs or prompts

## 10) Observability and Alerts
- Health APIs: `/api/health`, `/api/health/heartbeat`
- Logs: Docker logs (`web`, `worker`, `redis`)
- Metrics/trace dashboard: `https://binbang.moodybeard.com/admin/monitoring`, `https://binbang.moodybeard.com/admin/throughput`, `https://binbang.moodybeard.com/admin/heartbeat` (trace dashboard 없음)
- Incident channel and on-call routing: `github:issues`

## 11) Ownership
- Repo: `qorlgns1/binbang`
- Service owner/on-call: `KIHOON BAE`

## 12) Change History
- 2026-02-18: env 파일 구조 개선 — `.env.deploy.<env>` 분리, `with-env` 단일화, deploy.yml 통합
- 2026-02-15: initial structured deployment document created

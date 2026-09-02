# Deployment Guide

> **Status: CURRENT — Source of Truth (배포 절차)**
> `CLAUDE.md` 규약상 서버/배포 변경 제안 전 반드시 읽는다.

Last verified: 2026-04-17
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
  - Primary DB: Oracle ADB (`ORACLE_USER` / `ORACLE_PASSWORD` / `ORACLE_CONNECT_STRING`)
  - Shared Agoda catalog: `BINBANG_SHARED` 스키마 (`agoda_hotels`, `agoda_hotels_search` — dev/prod 읽기 전용 공유)
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
6. Run TypeORM migration (+ seed)
7. Start/update compose services

## 4) Env File Structure (Server)

> 2026-09-02부터 런타임 시크릿(OAuth, DB, API 키 등)은 **Doppler**가 source of truth다. 과거의 `.env.common` / `.env.<env>` / `apps/<app>/.env.common` / `apps/<app>/.env.<env>` 수동 관리 파일들은 폐지 대상이며, 배포 스크립트가 매 배포마다 Doppler에서 서비스별 파일을 새로 생성한다. 상세 변수 인벤토리와 마이그레이션 배경은 `docs/deployment/DOPPLER.md` 참고.

| 파일 | 역할 | 관리 주체 |
|---|---|---|
| `.env.doppler.web.<env>` | web 컨테이너 런타임 secrets (Doppler project `binbang-web`) | 배포 스크립트가 매 배포마다 자동 생성 (gitignore) |
| `.env.doppler.worker.<env>` | worker 컨테이너 런타임 secrets (Doppler project `binbang-worker`) | 배포 스크립트가 매 배포마다 자동 생성 (gitignore) |
| `.env.doppler.travel.<env>` | travel 컨테이너 런타임 secrets (Doppler project `binbang-travel`) | 배포 스크립트가 매 배포마다 자동 생성 (gitignore) |
| `.env.deploy.production` / `.env.deploy.development` | 배포 메타데이터 (IMAGE_TAG, DIGEST, DEPLOY_SHA 등) | CI/CD 자동 기록 (Doppler와 무관) |

Docker Compose는 각 서비스가 자신의 `.env.doppler.<service>.<env>` 파일 하나만 `env_file`로 로드한다(`docker/docker-compose.production.yml`, `docker/docker-compose.develop.yml`). `APP_ENV`/`NODE_ENV`/서비스 간 내부 URL처럼 시크릿이 아닌 값은 compose의 `environment:` 블록에 직접 명시한다.

DB 마이그레이션 등 호스트에서 직접 실행하는 pnpm 스크립트는 `doppler run --token "$DOPPLER_TOKEN_WEB" -- <command>`로 감싸서 Oracle 접속 정보를 주입한다(`.github/workflows/deploy.yml` 참고).

## 5) Standard Deploy Procedure
### Production (`main`)
```bash
cd ~/workspace/binbang
git fetch origin main
git checkout -B main origin/main
git reset --hard origin/main

doppler secrets download --no-file --format env --token "$DOPPLER_TOKEN_WEB"    > .env.doppler.web.production
doppler secrets download --no-file --format env --token "$DOPPLER_TOKEN_WORKER" > .env.doppler.worker.production
doppler secrets download --no-file --format env --token "$DOPPLER_TOKEN_TRAVEL" > .env.doppler.travel.production

docker compose -f docker/docker-compose.production.yml \
  --env-file .env.deploy.production \
  pull

doppler run --token "$DOPPLER_TOKEN_WEB" -- pnpm db:migrate:deploy
doppler run --token "$DOPPLER_TOKEN_WEB" -- pnpm db:seed:base

docker compose -f docker/docker-compose.production.yml \
  --env-file .env.deploy.production \
  up -d
```

### Development (`develop`)
```bash
cd ~/workspace/binbang
git fetch origin develop
git checkout -B develop origin/develop
git reset --hard origin/develop

doppler secrets download --no-file --format env --token "$DOPPLER_TOKEN_WEB"    > .env.doppler.web.development
doppler secrets download --no-file --format env --token "$DOPPLER_TOKEN_WORKER" > .env.doppler.worker.development
doppler secrets download --no-file --format env --token "$DOPPLER_TOKEN_TRAVEL" > .env.doppler.travel.development

docker compose -p binbang-dev -f docker/docker-compose.develop.yml \
  --env-file .env.deploy.development \
  pull

doppler run --token "$DOPPLER_TOKEN_WEB" -- pnpm db:migrate:deploy
doppler run --token "$DOPPLER_TOKEN_WEB" -- pnpm db:seed:base
doppler run --token "$DOPPLER_TOKEN_WEB" -- pnpm --filter @workspace/db db:seed

docker compose -p binbang-dev -f docker/docker-compose.develop.yml \
  --env-file .env.deploy.development \
  up -d
```

`$DOPPLER_TOKEN_WEB` / `$DOPPLER_TOKEN_WORKER` / `$DOPPLER_TOKEN_TRAVEL`은 각각 Doppler project `binbang-web` / `binbang-worker` / `binbang-travel`의 해당 config(`prd`/`dev`)에 대한 서비스 토큰이다. CI에서는 GitHub Environment secrets로 주입되고, 수동 배포 시에는 `doppler login` 후 프로젝트/config를 select 하거나 토큰을 셸 환경변수로 export해서 사용한다.

## 6) Database Migration Policy
- Migration tool: TypeORM Migrate (`typeorm migration:run`)
- **On OCI host**: `APP_ENV=production pnpm db:migrate:deploy` — `with-env`를 통해 `.env.production.local`과 `.env.production`을 로드한다.
- Timing: before final `compose up -d`
- Compatibility: maintain backward-compatible schema for rolling restart windows
- Prohibited flow: TypeORM `synchronize: true` / 수동 DDL (repo rule)
- Shared Agoda catalog(`agoda_hotels`, `agoda_hotels_search`)는 `BINBANG_SHARED` 스키마로 분리된 dev/prod 공유 읽기 전용 카탈로그다. 환경 migration이 아닌 `packages/db/sql/agoda_shared_catalog.sql`로 관리하며, TypeORM migration은 이 테이블을 건드리지 않는다.

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
- Runtime secrets (OAuth, DB, API 키 등): **Doppler** — projects `binbang-web` / `binbang-worker` / `binbang-travel`, configs `dev`/`prd`. 서비스 토큰은 GitHub Environment secrets(`DOPPLER_TOKEN_WEB`/`WORKER`/`TRAVEL`)로 CI에 주입된다. 자세한 변수 인벤토리와 마이그레이션 절차는 `docs/deployment/DOPPLER.md`.
- CI/CD secrets: GitHub Actions Secrets (`DOCKERHUB_*`, `OCI_*`, `RELEASE_TAG_PAT`, `DOPPLER_TOKEN_WEB`, `DOPPLER_TOKEN_WORKER`, `DOPPLER_TOKEN_TRAVEL`)
- CI/CD variables: GitHub Actions Variables (`NEXT_PUBLIC_*`)
- Runtime env files on server (배포 시 자동 생성, gitignore):
  - `.env.doppler.web.<env>`, `.env.doppler.worker.<env>`, `.env.doppler.travel.<env>` — Doppler에서 매 배포마다 새로 생성
  - `.env.deploy.production` / `.env.deploy.development` (CI/CD 자동 기록 — IMAGE_TAG, DIGEST, DEPLOY_SHA 등; Doppler와 무관)
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
- 2026-09-02: 런타임 secrets를 Doppler로 이관 (project `binbang-web`/`binbang-worker`/`binbang-travel`). `.env.common`/앱별 수동 env 파일 폐지, 배포 스크립트가 `.env.doppler.<service>.<env>`를 매 배포마다 생성하도록 변경
- 2026-04-17: PostgreSQL+Prisma → Oracle ADB+TypeORM 마이그레이션 반영 (데이터 저장소 교체, migration 도구 교체, `agoda_hotels*` 공유 스키마 분리)
- 2026-02-18: env 파일 구조 개선 — `.env.deploy.<env>` 분리, `with-env` 단일화, deploy.yml 통합
- 2026-02-15: initial structured deployment document created

# Environment Matrix

Last verified: 2026-02-15
Owner: binbang

## 1) Environments
| Environment | Purpose | Branch/Tag Rule | URL | Deploy Trigger | Notes |
|---|---|---|---|---|---|
| dev | integration/test on server | `develop` / `develop` image tag | `https://dev-binbang.moodybeard.com` | GitHub Actions `deploy.yml` on push | Compose project: `binbang-dev`, web -> `:3200` |
| dev-travel | travel app test on server | `develop` / `develop` image tag | `https://dev-travel.moodybeard.com` | GitHub Actions `deploy.yml` on push | Same compose project: `binbang-dev`, travel -> `:3301` |
| staging | not configured | `N/A` | `N/A` | `N/A` | Create if pre-prod isolation is needed |
| production | live traffic | `main` / `main` image tag | `https://binbang.moodybeard.com` | GitHub Actions `deploy.yml` on push | web -> `:4000` |
| production-travel | travel app live | `main` / `main` image tag | `https://travel.moodybeard.com` | GitHub Actions `deploy.yml` on push | travel -> `:3300` |

## 2) Runtime and Infra Differences
| Item | dev | staging | production |
|---|---|---|---|
| Compose file | `docker/docker-compose.develop.yml` | `N/A` | `docker/docker-compose.production.yml` |
| Domain (web) | `dev-binbang.moodybeard.com` | `N/A` | `binbang.moodybeard.com` |
| Domain (travel) | `dev-travel.moodybeard.com` | `N/A` | `travel.moodybeard.com` |
| Web upstream port (host) | `3200` | `N/A` | `4000` |
| Travel upstream port (host) | `3301` | `N/A` | `3300` |
| Compose project name | `binbang-dev` | `N/A` | default |
| Redis | `redis:7-alpine` | `N/A` | `redis:7-alpine` |
| DB | external PostgreSQL (`DATABASE_URL`) | `N/A` | external PostgreSQL (`DATABASE_URL`) |
| Replica count | 1 web / 1 worker / 1 travel / 1 redis | `N/A` | 1 web / 1 worker / 1 travel / 1 redis |

## 3) External Integrations by Environment
| Integration | dev | staging | production | Failure impact |
|---|---|---|---|---|
| Google OAuth | enabled via env | `N/A` | enabled via env | login failure |
| Kakao OAuth | enabled via env | `N/A` | enabled via env | login/notification flow impact |
| Google Analytics | optional (`NEXT_PUBLIC_GA_MEASUREMENT_ID`) | `N/A` | optional | analytics visibility loss |
| Docker Hub pull | required | `N/A` | required | deploy blocked |

## 4) Env Vars (Names Only)
### Common core
- `APP_ENV`
- `DATABASE_URL`
- `REDIS_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `KAKAO_CLIENT_ID`
- `KAKAO_CLIENT_SECRET`
- `WORKER_CONTROL_PORT`
- `WORKER_INTERNAL_URL`

### Deploy/runtime metadata
- `IMAGE_TAG`
- `IMAGE_WEB_DIGEST`
- `IMAGE_WORKER_DIGEST`
- `DEPLOY_SHA`
- `DEPLOYED_AT`

### Optional monitoring tuning
- `HEARTBEAT_INTERVAL_MS`
- `HEARTBEAT_MISSED_THRESHOLD`
- `HEARTBEAT_CHECK_INTERVAL_MS`
- `MAX_PROCESSING_TIME_MS`
- `WORKER_HEALTHY_THRESHOLD_MS`
- `WORKER_DEGRADED_THRESHOLD_MS`

### Travel app (apps/travel)
- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini API (chat)
- `GOOGLE_MAPS_API_KEY` — server-side Maps (Places etc.)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — client-side map display
- `OPENWEATHERMAP_API_KEY` — weather tool
- `EXCHANGERATE_API_KEY` — exchange rate tool  
- `DATABASE_URL` — same as common (travel uses `@workspace/db` for conversations/entities)

## 5) Access and Guardrails
- Deployment entrypoint: GitHub Actions `deploy.yml`
- Deployment authority: users with push permission to `main`/`develop` and environment secret access
- Production guardrail: run migration + health checks before completion
- Recommended improvement: enforce branch protection and required reviews on `main`

## 6) Validation Checklist Per Environment
### dev
- [ ] `https://dev-binbang.moodybeard.com/api/health` returns `200`
- [ ] `https://dev-travel.moodybeard.com` loads travel app
- [ ] `docker compose -p binbang-dev -f docker/docker-compose.develop.yml --env-file .env.development ps`
- [ ] Basic login and accommodation list flow works

### production
- [ ] `https://binbang.moodybeard.com/api/health` returns `200`
- [ ] `https://travel.moodybeard.com` loads travel app
- [ ] `docker compose -f docker/docker-compose.production.yml --env-file .env.production ps`
- [ ] Admin heartbeat check (`/api/health/heartbeat`) is healthy
- [ ] Recent logs show no recurring startup errors

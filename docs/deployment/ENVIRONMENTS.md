# Environment Matrix

Last verified: 2026-02-18
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

## 4) Env File Structure (Server)
각 환경별로 두 파일을 운영한다.

```
.env.<APP_ENV>           — 런타임 설정 (수동 관리)
.env.<APP_ENV>.local     — 서버 로컬 오버라이드, gitignore (수동 관리, 선택)
.env.deploy.<APP_ENV>    — 배포 메타데이터, gitignore (CI/CD 자동 기록)
```

Docker Compose는 `--env-file` 순서상 나중 파일이 이기므로 `.env.deploy.<APP_ENV>`를 마지막에 로드한다.
`pnpm with-env`는 dotenv first-wins 규칙에 따라 `.env.<APP_ENV>.local`을 먼저 로드한다.

## 5) Env Vars (Names Only)
### Common core (`.env.<APP_ENV>`)
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

### Deploy/runtime metadata (`.env.deploy.<APP_ENV>` — CI/CD 자동 기록)
- `IMAGE_TAG`
- `IMAGE_WEB_DIGEST`
- `IMAGE_WORKER_DIGEST`
- `IMAGE_TRAVEL_DIGEST`
- `DEPLOY_SHA`
- `DEPLOYED_AT`

### Optional monitoring tuning (`.env.<APP_ENV>`)
- `HEARTBEAT_INTERVAL_MS`
- `HEARTBEAT_MISSED_THRESHOLD`
- `HEARTBEAT_CHECK_INTERVAL_MS`
- `MAX_PROCESSING_TIME_MS`
- `WORKER_HEALTHY_THRESHOLD_MS`
- `WORKER_DEGRADED_THRESHOLD_MS`

### Travel app (`.env.<APP_ENV>`)
- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini API (chat)
- `GOOGLE_MAPS_API_KEY` — server-side Maps (Places etc.)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — client-side map display
- `OPENWEATHERMAP_API_KEY` — weather tool
- `EXCHANGERATE_API_KEY` — exchange rate tool
- `CONTEXT_WINDOW_SIZE` — AI 대화 컨텍스트 윈도우
- `TRAVEL_GUEST_DAILY_LIMIT` — 게스트 일일 요청 제한
- `TRAVEL_GUEST_PER_CONVERSATION_LIMIT` — 게스트 대화당 요청 제한
- `DATABASE_URL` — same as common (travel uses `@workspace/db` for conversations/entities)

## 6) Access and Guardrails
- Deployment entrypoint: GitHub Actions `deploy.yml`
- Deployment authority: users with push permission to `main`/`develop` and environment secret access
- Production guardrail: run migration + health checks before completion
- Recommended improvement: enforce branch protection and required reviews on `main`

## 7) Validation Checklist Per Environment
### dev
- [ ] `https://dev-binbang.moodybeard.com/api/health` returns `200`
- [ ] `https://dev-travel.moodybeard.com` loads travel app
- [ ] `docker compose -p binbang-dev -f docker/docker-compose.develop.yml --env-file .env.development --env-file .env.deploy.development ps`
- [ ] Basic login and accommodation list flow works

### production
- [ ] `https://binbang.moodybeard.com/api/health` returns `200`
- [ ] `https://travel.moodybeard.com` loads travel app
- [ ] `docker compose -f docker/docker-compose.production.yml --env-file .env.production --env-file .env.deploy.production ps`
- [ ] Admin heartbeat check (`/api/health/heartbeat`) is healthy
- [ ] Recent logs show no recurring startup errors

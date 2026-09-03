# Environment Matrix

> **Status: CURRENT — Source of Truth (환경 정의)**
> `CLAUDE.md` 규약상 서버/배포 변경 제안 전 반드시 읽는다.

Last verified: 2026-04-17
Owner: binbang

## 1) Environments
| Environment | Purpose | Branch/Tag Rule | URL | Deploy Trigger | Notes |
|---|---|---|---|---|---|
| dev | integration/test on server | `develop` / `develop` image tag | `https://dev-binbang.moodybeard.com` | GitHub Actions `deploy.yml` on push | Compose project: `binbang-dev`, web -> `:3200` |
| dev-travel | travel app test on server | `develop` / `develop` image tag | `https://dev-travel.moodybeard.com` | GitHub Actions `deploy.yml` on push | Same compose project: `binbang-dev`, travel -> `:3301` |
| production | live traffic | `main` / `main` image tag | `https://binbang.moodybeard.com` | GitHub Actions `deploy.yml` on push | web -> `:4000` |
| production-travel | travel app live | `main` / `main` image tag | `https://travel.moodybeard.com` | GitHub Actions `deploy.yml` on push | travel -> `:3300` |

## 2) Runtime and Infra Differences
| Item | dev | production |
|---|---|---|
| Compose file | `docker/docker-compose.develop.yml` | `docker/docker-compose.production.yml` |
| Domain (web) | `dev-binbang.moodybeard.com` | `binbang.moodybeard.com` |
| Domain (travel) | `dev-travel.moodybeard.com` | `travel.moodybeard.com` |
| Web upstream port (host) | `3200` | `4000` |
| Travel upstream port (host) | `3301` | `3300` |
| Compose project name | `binbang-dev` | default |
| Redis | `redis:7-alpine` | `redis:7-alpine` |
| DB | Oracle ADB (`ORACLE_CONNECT_STRING`) | Oracle ADB (`ORACLE_CONNECT_STRING`) |
| Replica count | 1 web / 1 worker / 1 travel / 1 redis | 1 web / 1 worker / 1 travel / 1 redis |

## 3) External Integrations by Environment
| Integration | dev | production | Failure impact |
|---|---|---|---|
| Google OAuth | enabled via env | enabled via env | login failure |
| Kakao OAuth | enabled via env | enabled via env | login/notification flow impact |
| Google Analytics | optional (`NEXT_PUBLIC_GA_MEASUREMENT_ID`) | optional | analytics visibility loss |
| Docker Hub pull | required | required | deploy blocked |

## 4) Env File Structure (Server)

> 2026-09-02부터 runtime secrets는 **Doppler**로 관리한다 (`docs/deployment/DOPPLER.md` 참고). 아래는 배포 스크립트가 생성하는 파일 구조다.

```
.env.doppler.web.<APP_ENV>       — web 컨테이너용, Doppler project binbang-web에서 매 배포마다 생성 (gitignore)
.env.doppler.worker.<APP_ENV>    — worker 컨테이너용, Doppler project binbang-worker에서 생성 (gitignore)
.env.doppler.travel.<APP_ENV>    — travel 컨테이너용, Doppler project binbang-travel에서 생성 (gitignore)
.env.deploy.<APP_ENV>            — 배포 메타데이터, gitignore (CI/CD 자동 기록, Doppler와 무관)
```

Docker Compose는 서비스별로 자신의 `.env.doppler.<service>.<APP_ENV>` 하나만 `env_file`로 로드한다. `APP_ENV`/`NODE_ENV`/서비스 간 내부 URL(`WORKER_INTERNAL_URL` 등)처럼 secret이 아닌 값은 compose `environment:` 블록에 하드코딩되어 있으며 Doppler로 관리하지 않는다.
호스트에서 직접 실행하는 pnpm 스크립트(`db:migrate:deploy` 등)는 `doppler run --token "$DOPPLER_TOKEN_WEB" -- <command>`로 감싼다.

## 5) Env Vars (Names Only)

> Doppler project 기준으로 재정리. 3개 프로젝트(`binbang-web`/`binbang-worker`/`binbang-travel`) 각각의 `dev`/`prd` config에 아래 "Common core"가 **중복 저장**되고, 프로젝트별 전용 값이 추가된다 (앱별 별도 project 구조를 선택했기 때문 — 공통값 변경 시 3곳 모두 업데이트 필요).

### Common core (3개 project 모두에 중복 보관)
- `ORACLE_USER`
- `ORACLE_PASSWORD`
- `ORACLE_CONNECT_STRING`
- `ORACLE_AGODA_SHARED_SCHEMA`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `KAKAO_CLIENT_ID`
- `KAKAO_CLIENT_SECRET`

`APP_ENV` / `REDIS_URL` / `WORKER_INTERNAL_URL` / `WORKER_CONTROL_PORT`는 secret이 아니라 compose `environment:`에 직접 값이 박혀 있어 Doppler 대상이 아니다 (`WORKER_CONTROL_PORT`만 예외 — worker 전용 항목 참고).

### `binbang-web` project 전용
- `AGODA_AFFILIATE_API_KEY`, `AGODA_AFFILIATE_SITE_ID`
- `AWIN_API_TOKEN`
- `BINBANG_INTERNAL_API_TOKEN`
- `BINBANG_UNSUBSCRIBE_SECRET`
- `GOOGLE_FORM_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `WEB_PORT`
- `NEXTAUTH_URL`
- `SENTRY_DSN` / `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_ENVIRONMENT` / `SENTRY_SEND_DEFAULT_PII`
- `NEXT_PUBLIC_SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_ENVIRONMENT` / `NEXT_PUBLIC_SENTRY_SEND_DEFAULT_PII`

### `binbang-worker` project 전용
- `AFFILIATE_AUDIT_ALERT_TELEGRAM_BOT_TOKEN` / `_CRITICAL_CHAT_ID` / `_CRITICAL_THREAD_ID` / `_WARNING_CHAT_ID` / `_WARNING_THREAD_ID` / `_DEDUPE_WINDOW_SECONDS` / `_RECOVERY_ENABLED`
- `AFFILIATE_AUDIT_PURGE_CRON` / `_CRON_MISS_THRESHOLD_MINUTES` / `_CRON_WATCHDOG` / `_RETRY_BACKOFF_SECONDS` / `_RETRY_MAX`
- `AFFILIATE_AUDIT_RETENTION_DAYS`
- `AFFILIATE_RUN_STARTED_REDIS_KEY_PREFIX`
- `BINBANG_INTERNAL_API_TOKEN` (web과 값 중복)
- `RESEND_API_KEY` (web과 값 중복)
- `EMAIL_FROM` (web과 값 중복)
- `WORKER_CONTROL_PORT`
- `TRAVEL_CACHE_PREWARM_CRON`, `TRAVEL_CACHE_PREWARM_TIMEOUT_MS`
- `TRAVEL_INTERNAL_CRON_TOKEN` (travel과 값 중복)

### `binbang-travel` project 전용
- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini API (chat)
- `GOOGLE_MAPS_API_KEY` — server-side Maps (Places etc.)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — client-side map display
- `OPENWEATHERMAP_API_KEY` — weather tool
- `EXCHANGERATE_API_KEY` — exchange rate tool
- `CONTEXT_WINDOW_SIZE` — AI 대화 컨텍스트 윈도우
- `AWIN_API_TOKEN` (web과 값 중복)
- `TRAVEL_INTERNAL_CRON_TOKEN` (worker와 값 중복)
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_WEB_URL` (dev only)
- `SENTRY_*` / `NEXT_PUBLIC_SENTRY_*` — web과 동일 항목 세트

### Deploy/runtime metadata (`.env.deploy.<APP_ENV>` — CI/CD 자동 기록, Doppler와 무관)
- `IMAGE_TAG`
- `IMAGE_WEB_DIGEST`
- `IMAGE_WORKER_DIGEST`
- `IMAGE_TRAVEL_DIGEST`
- `DEPLOY_SHA`
- `DEPLOYED_AT`
- ⚠️ `IMAGE_MOONCATCH_DIGEST` — 서버 파일에 존재하나 어떤 문서/compose에도 대응 서비스가 없음. 사용처 확인 후 삭제 또는 문서화 필요.

### 문서에는 있으나 서버 어떤 env 파일에도 없는 값 (검증 필요)
아래는 과거 버전 문서에 이름만 남아 있고, 서버의 어떤 env 파일에서도 실제로 발견되지 않았다. 코드 기본값에 의존 중인지, 다른 방식(하드코딩/DB 설정 등)으로 관리되는지 확인 후 Doppler 이관 여부를 결정해야 한다.
- `HEARTBEAT_INTERVAL_MS`, `HEARTBEAT_MISSED_THRESHOLD`, `HEARTBEAT_CHECK_INTERVAL_MS`
- `MAX_PROCESSING_TIME_MS`, `WORKER_HEALTHY_THRESHOLD_MS`, `WORKER_DEGRADED_THRESHOLD_MS`
- `TRAVEL_GUEST_DAILY_LIMIT`, `TRAVEL_GUEST_PER_CONVERSATION_LIMIT`
- `TRAVEL_AFFILIATE_TRACKING_ENABLED`, `TRAVEL_AFFILIATE_CTA_ENABLED`, `TRAVEL_RESTORE_AUTO_ENABLED`, `TRAVEL_HISTORY_EDIT_ENABLED` (RUNBOOK.md §9 롤백 절차가 참조하는 플래그 — 실제로 주입되지 않으면 롤백 절차가 동작하지 않음)

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

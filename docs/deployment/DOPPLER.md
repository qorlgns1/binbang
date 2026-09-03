# Doppler Migration Playbook

> **Status: dev 배포 검증 + 서버 구식 파일 정리 완료(2026-09-02) — main 배포는 아직**
> `CLAUDE.md` 규약상 서버/배포 변경 제안 전 반드시 읽는다. 이 문서가 실제 배포 절차와 다르면 `DEPLOYMENT.md`/`ENVIRONMENTS.md`가 최신 기준이며, 이 문서를 갱신한다.

Last verified: 2026-09-02
Owner: binbang

## 1) 배경

OCI 서버(`~/workspace/binbang`)의 런타임 env가 아래처럼 흩어져 있어 어떤 값이 실제로 쓰이는지 추적이 안 되는 상태였다.

- 루트: `.env.common`, `.env.production`(+`.local`), `.env.development`(+`.local`), 각종 `.bak`/`.backup` 잔재 5개
- 앱별(문서에 없던 레이어): `apps/web/.env.common`+`.env.production`, `apps/worker/.env.common`, `apps/travel/.env.common`+`.env.production`
- Docker Compose가 서비스 하나당 파일을 최대 4개(`env_file:` 리스트)까지 겹쳐 로드

이를 Doppler로 이관해 **project = 배포 단위(앱)**, **config = 환경(dev/prd)** 구조로 단순화한다.

## 2) Doppler 구조 (선택된 안: 앱별 별도 project)

```
binbang-web/     configs: dev, prd
binbang-worker/  configs: dev, prd
binbang-travel/  configs: dev, prd
```

공통 값(OAuth, `NEXTAUTH_SECRET`, Oracle 접속 정보)은 **3개 project 모두에 각각 저장**한다(값 복제). 이 구조를 선택한 이유는 프로젝트별 접근 권한을 독립적으로 관리하기 위함이며, 대가로 공통 값 변경 시 3곳을 모두 갱신해야 한다 — 변경 시 아래 §5 커맨드를 세 project에 반복 실행할 것.

전체 변수 인벤토리(어떤 project에 뭐가 들어가는지)는 `ENVIRONMENTS.md` §5를 source of truth로 참고한다. 요약:

| Project | 포함 값 |
|---|---|
| `binbang-web` | 공통(OAuth/NEXTAUTH_SECRET/Oracle) + Agoda affiliate, Awin, Resend, BINBANG 내부 토큰, Sentry(web) |
| `binbang-worker` | 공통 + Affiliate audit/텔레그램 알림, Travel cache prewarm, worker 제어 포트 |
| `binbang-travel` | 공통 + Gemini/Maps/날씨/환율 API 키, Sentry(travel) |

DB 마이그레이션 등 호스트 직접 실행 스크립트(`pnpm db:migrate:deploy`)는 **`binbang-web`의 Oracle 값**을 기준으로 삼기로 했다(임의 선택 — DB 소유 앱이 명확하지 않아 web project로 고정). 다른 project를 쓰고 싶다면 `.github/workflows/deploy.yml`의 `DOPPLER_TOKEN_WEB` 참조 부분을 바꿔야 한다.

## 3) 진행 상태

- [x] Doppler 로그인 (workplace `moodybeard`, 기존 전역 로그인 사용)
- [x] project 3개 생성: `binbang-web`, `binbang-worker`, `binbang-travel` (`binbang-web`은 이미 존재했음)
- [x] 각 project의 `dev`/`prd` config에 **키 이름만** 위 인벤토리대로 업로드 완료 (값은 전부 빈 문자열 placeholder — 실제 secret 값은 아직 없음). `stg` config는 기본 스캐폴드로 남아있고 사용 안 함. `dev_personal`은 로컬 개발 전용으로 사용한다(§5).
- [x] 각 project × config에 **실제 값** 입력 완료 — OCI 서버의 `.env.common`/`.env.<env>`/`apps/<app>/.env.common`/`apps/<app>/.env.<env>`를 SSH로 읽어 `doppler secrets upload /dev/stdin`으로 직접 파이프(값이 세션 컨텍스트나 화면에 출력되지 않도록 전 과정 로컬 로그 파일로 리다이렉트 후 즉시 파기, 길이 비교로만 검증). `binbang-worker`의 `AFFILIATE_AUDIT_ALERT_TELEGRAM_*` 5개는 서버에도 값이 없어 비어있음(Telegram 알림 미설정 상태로 추정 — 실제로 쓸 계획이면 별도로 채워야 함).
- [x] 각 project × config 조합으로 **read-only 서비스 토큰** 발급 완료 (`dev` config 토큰은 develop 배포용, `prd` config 토큰은 main 배포용). 토큰 값은 생성과 동시에 `gh secret set`으로 파이프해서 세션에 노출되지 않음.
- [x] GitHub repo의 Environment `main`/`develop`에 `DOPPLER_TOKEN_WEB`/`DOPPLER_TOKEN_WORKER`/`DOPPLER_TOKEN_TRAVEL` secret 등록 완료 (main엔 prd 토큰, develop엔 dev 토큰). 이 작업엔 fine-grained PAT에 Secrets + **Environments** 두 권한이 모두 필요했음(처음엔 Secrets만 있어서 environment secret 쓰기가 403이었음).
- [x] OCI 호스트에 Doppler CLI 설치 확인 완료 (v3.76.5, 2026-09-02에 미리 설치해둠 — 첫 배포 때 자동 설치 로직이 안 타도 됨)
- [x] `develop` 브랜치 push로 dev 배포 검증 완료 (2026-09-02). `binbang-dev-web-1`에 `DOPPLER_CONFIG`/`DOPPLER_ENVIRONMENT`/`DOPPLER_PROJECT` 메타 키가 실제로 주입됨을 확인, `/api/health` 200. 검증 중 발견한 두 가지 별개 이슈:
  - Doppler와 무관한 기존 버그: `docker/bake-action`의 provenance metadata가 리포 크기에 비례해 커져 `Extract digests` 스텝에서 "Argument list too long"으로 실패 → `.github/workflows/deploy.yml`에 `BUILDX_METADATA_PROVENANCE: min` 추가로 해결(커밋 `777685a`). 최근 배포가 4개월 넘게 없어서 이번에 처음 걸림.
  - `travel.moodybeard.com`/`dev-travel.moodybeard.com` 502 발견 — 원인은 `docker/nginx/*travel*.conf`가 `proxy_pass http://127.0.0.1:<port>`로 되어 있는데 nginx가 별도 Docker 브릿지 네트워크 컨테이너라 호스트 127.0.0.1에 닿지 못하는 사전 존재 버그(`web`용 conf는 컨테이너명+`resolver`를 써서 정상). **사용자 확인: travel은 현재 운영하지 않는 프로젝트라 급하게 고칠 필요 없음** — 나중에 travel을 다시 운영할 때 `dev-binbang.moodybeard.com.conf` 패턴으로 고칠 것.
- [x] 서버 구식 파일 정리 완료 (2026-09-02). 삭제 전 `pnpm with-env`가 쓰는 `dotenv-cli`(v11)가 `-e`로 지정한 파일이 없어도 에러 없이 넘어가는 것을 로컬에서 확인 — `doppler run`이 이미 실제 값을 프로세스 env로 주입하므로 root `.env.production`/`.local`이 없어도 `db:migrate:deploy`는 정상 동작. 삭제한 것: root의 `.env.common`/`.env.production`(+`.local`)/`.env.development`(+`.local`)/`.bak.*`/`.backup`, `apps/{web,worker,travel}/.env.{common,production,development}`(+ travel의 `.bak.*`). 남긴 것: `.env.deploy.<env>`(CI 메타데이터), `.env.example`류(repo 추적 템플릿), `.env.doppler.*.<env>`(매 배포마다 자동 생성). 삭제 후 dev 컨테이너 health/ps 재확인 완료 — 영향 없음.
- [x] **⚠️ prod 안전망 파일 복원 (2026-09-02, 임시)** — `main` 브랜치는 아직 이 Doppler 변경을 받지 않아서, `main`의 `docker-compose.production.yml`(구버전)은 여전히 `../.env.common`/`../.env.production`/`../apps/{web,worker,travel}/.env.common`을 **필수**로 요구한다(`required: false`가 없음). 이미 떠 있는 prod 컨테이너의 단순 재시작(크래시 복구·호스트 리부팅)은 이 파일이 없어도 괜찮지만(컨테이너 재생성이 아니므로), **main에 push되거나 누군가 수동으로 `docker compose up`을 다시 돌리면** 파일이 없어서 실패한다. 그래서 이 5개 파일만 Doppler(`binbang-web`/`binbang-worker`/`binbang-travel`의 `prd` config)에서 값을 다시 받아 최소한으로 복원해뒀다: `.env.common`, `.env.production`(+ `APP_ENV=production` — Doppler엔 없는 값이라 수동 추가), `apps/web/.env.common`, `apps/worker/.env.common`, `apps/travel/.env.common`.
  **main이 이 Doppler 변경을 받아 배포되면 이 5개 파일은 다시 지워야 한다** (그때는 `docker-compose.production.yml`이 `.env.doppler.<service>.production`만 요구하므로 더 이상 필요 없음).
- [ ] `IMAGE_MOONCATCH_DIGEST` (`.env.deploy.production`/`.development`에 있는 미문서화 키)의 용도 확인 — 안 쓰면 배포 스크립트/파일에서 제거
- [ ] RUNBOOK.md의 `TRAVEL_AFFILIATE_*`/`TRAVEL_RESTORE_AUTO_ENABLED`/`TRAVEL_HISTORY_EDIT_ENABLED` 플래그가 코드에서 실제로 읽히는지 확인 — 읽힌다면 Doppler(`binbang-web` 또는 `binbang-travel`, 코드 확인 후 결정)에 추가해야 롤백 절차가 실제로 동작함

### 3-1) 값 채워넣기

각 project × config(6곳)에 키 이름은 이미 들어가 있다. 서버의 현재 값을 옮길 때는 **한 커맨드에 여러 개의 빈 값(`KEY=`)을 나열하지 말 것** — Doppler CLI가 인자를 잘못 이어붙이는 문제가 있었다(이번에 실제로 겪음). 안전한 방법 두 가지:

```bash
# 방법 1: 키 하나씩 (여러 키를 한 줄에 섞지 말 것)
doppler secrets set ORACLE_PASSWORD="실제값" --project binbang-web --config prd

# 방법 2 (추천): .env 파일로 만들어서 업로드 — 값이 여러 개여도 안전
cat > /tmp/binbang-web-prd.env <<'EOF'
ORACLE_USER=실제값
ORACLE_PASSWORD=실제값
...
EOF
doppler secrets upload /tmp/binbang-web-prd.env --project binbang-web --config prd
rm /tmp/binbang-web-prd.env
```

공통 값(ORACLE_*, NEXTAUTH_SECRET, GOOGLE_*, KAKAO_*)은 3개 project 모두에 동일하게 입력해야 한다.

## 4) main 배포 전 체크리스트

- [x] §3의 남은 체크박스 완료 (실제 값 입력 / 서비스 토큰 / GitHub secrets)
- [x] develop 배포로 최소 1회 성공 검증 (2026-09-02)
- [ ] `docker compose ... config`로 두 compose 파일이 `required: true`인 `.env.doppler.*` 파일을 정상적으로 찾는지 확인 (파일이 없으면 컨테이너가 아예 안 뜸 — 의도된 fail-fast)
- [ ] 롤백 계획: Doppler 다운로드가 실패하면 배포가 검증 전까지는 기존 수동 파일로 되돌릴 수 있도록, 서버 구식 파일 정리는 dev/main 모두 검증된 뒤에만 수행

## 5) 로컬 개발 환경

2026-09-02부터 로컬 개발은 `.env.local`을 전혀 쓰지 않고 전부 Doppler(`dev` config)에서 받는다. root/`apps/{web,worker,travel}`의 `.env.local` 파일은 전부 삭제했다(git엔 원래 안 잡히던 파일들 — `.gitignore`의 `.env.*` 규칙 때문에 `.env.example`만 예외).

### 값을 누가 넣는가 (레이어 규칙)

명령 하나에 Doppler 는 **한 번만** 개입한다. 겹치면 안쪽이 이겨서 바깥에서 지정한 값이 조용히 덮어써진다.

| 명령 | 값 주입 주체 | Doppler project |
|---|---|---|
| `pnpm dev` / `dev:web` / `dev:travel` / `dev:worker` | **각 앱의 `dev` 스크립트** | 앱별(web/travel/worker) |
| `pnpm db:*`, `agoda:*`, `tsx scripts/*` | **`with-env`** | `binbang-web` (DB 소유로 지정) |
| `pnpm lint` / `typecheck` / `test` / `build` / `ci:check` | **없음 — 비밀값 불필요** | — |

루트 `dev:*` 스크립트는 `with-env` 를 거치지 않는다. 앱 스크립트가 이미 자기 project 로
Doppler 를 실행하므로, 루트에서 한 번 더 감싸면 이중 호출이 되고 바깥 값이 무시된다.
(실제로 이 이중 구조 때문에 e2e 가 깨진 적이 있다 — playwright 가 넘긴 `NEXTAUTH_URL` 을
앱 스크립트의 doppler 가 덮어써서 `__Secure-` 쿠키가 발급됐고 `page.request` 가 401 을 받았다.)

검증 명령도 거치지 않는다. `.github/workflows/ci.yml` 이 더미 env 만으로 같은 명령을
그대로 돌리고 있어, 비밀값이 필요 없다는 것이 CI 로 증명된다.

**앱별 `dev` 스크립트** — 각각 자기 Doppler project 의 로컬 전용 config 로 감싸져 있다:
```jsonc
// apps/web/package.json
"dev": "doppler run --project binbang-web --config dev_personal -- next dev --experimental-next-config-strip-types"
// apps/worker/package.json
"dev": "pnpm --filter @workspace/db build && doppler run --project binbang-worker --config dev_personal -- tsx watch src/main.ts"
// apps/travel/package.json
"dev": "doppler run --project binbang-travel --config dev_personal -- next dev --port 3300 --experimental-next-config-strip-types"
```

**`dev` 가 아니라 `dev_personal` 인 이유** — `dev` config 는 **배포된 dev 서버**(`dev-binbang.moodybeard.com`)가
쓰는 값이다. 로컬이 그걸 그대로 쓰면 `NEXTAUTH_URL` 이 배포 주소가 되어 로컬 OAuth 콜백과
세션 쿠키가 어긋난다. 로컬 전용 값은 `dev_personal` 에만 둔다.

**루트 `with-env`** — `scripts/with-env.sh`. `APP_ENV` 가 없으면(=로컬) `binbang-web` 의
`dev_personal` 로 감싸고, 있으면(=서버 배포) **아무것도 하지 않고 명령을 그대로 넘긴다**.
서버에서는 `deploy.yml` 이 바깥에서 `doppler run --token ...` 으로 이미 값을 주입한 뒤
호출하기 때문이다. 그래서 서버에서 수동으로 실행할 때도 반드시 `doppler run` 으로 감싸야 한다:

```bash
doppler run --token "$DOPPLER_TOKEN_WEB" -- pnpm db:migrate:deploy
```

**`local:docker`** — `scripts/local-docker.sh`로 바뀌었다. `docker compose`는 컨테이너에 값을 넣을 때 파일(`env_file:`)만 읽고 실행 중인 셸의 process env를 자동으로 전파하지 않으므로, `doppler secrets download`로 `binbang-web`/`binbang-worker`의 `dev` config를 `.env.doppler.local.web`/`.env.doppler.local.worker`로 내려받은 뒤 compose를 실행한다. `docker-compose.local.yml`의 `env_file:`도 이 파일들을 가리키도록 바꿨다.

**개발자가 해야 하는 것**: `doppler login` 후 팀 admin에게 `binbang-web`/`binbang-worker`/`binbang-travel` project의 `dev` config 접근 권한을 받으면 끝. 그 외 로컬 셋업 파일은 없다(`.doppler.yaml` 스코프 파일도 안 씀 — project/config가 스크립트에 직접 박혀 있어서 팀원이 `doppler setup`을 따로 안 해도 됨).

**한계**: Telegram 알림 관련 5개 키(`AFFILIATE_AUDIT_ALERT_TELEGRAM_*`)는 `dev`/`prd` 둘 다 비어있으니, 로컬에서 그 기능을 테스트하려면 Doppler `binbang-worker`/`dev` config에 직접 값을 채워야 한다(더 이상 개인 로컬 파일로 대체할 방법이 없다 — 팀 전체가 공유하는 `dev` config에 넣는 것이므로 값을 채울 땐 팀에 공유해도 되는 값인지 먼저 확인할 것).

**로컬 Redis 필요** — `apps/web`(필수)과 `apps/worker`(필수, `packages/worker-shared/src/runtime/settings/env.ts`가 시작 시점에 검증)는 `REDIS_URL`이 반드시 있어야 한다. 서버는 이 값을 compose `environment:`에 하드코딩(`redis://redis-prod:6379` 등)하므로 Doppler엔 원래 없었는데, `.env.local` 폐지 직후 `pnpm dev`가 `REDIS_URL: 값이 비어 있습니다` 에러로 실패하는 걸 실제로 겪었다. `redis://localhost:6379`를 `binbang-web`/`binbang-worker`/`binbang-travel`(travel은 선택 — 없으면 캐싱만 비활성화) 각 `dev` config에 추가해서 해결. **로컬에 Redis가 실제로 떠 있어야 한다** — `pnpm local:docker`로 한 번 띄워두면 계속 재사용 가능(이 리포에도 `binbang-redis-local`이라는 컨테이너가 이미 떠 있었음), 또는 `docker run -d -p 6379:6379 redis:7-alpine` 같은 별도 컨테이너도 무방.

## 6) 참고: Doppler CLI 공통 커맨드

```bash
# 서비스 토큰 발급 (read-only, CI용)
doppler configs tokens create ci-prd --project binbang-web --config prd --plain

# 로컬에서 다운로드해서 값 확인 (디버깅용, 화면에 secret이 출력되니 주의)
doppler secrets download --no-file --format env --project binbang-web --config prd

# 6개 project×config에 키가 몇 개 들어있는지 빠르게 확인
doppler secrets --project binbang-web --config prd --only-names
```

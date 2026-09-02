# Doppler Migration Playbook

> **Status: DRAFT — project/config/키 이름은 생성됨, 실제 값·서비스 토큰·GitHub secrets 연동은 아직**
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
- [x] 각 project의 `dev`/`prd` config에 **키 이름만** 위 인벤토리대로 업로드 완료 (값은 전부 빈 문자열 placeholder — 실제 secret 값은 아직 없음). `stg`/`dev_personal` config는 기본 스캐폴드로 남아있고 사용 안 함.
- [x] 각 project × config에 **실제 값** 입력 완료 — OCI 서버의 `.env.common`/`.env.<env>`/`apps/<app>/.env.common`/`apps/<app>/.env.<env>`를 SSH로 읽어 `doppler secrets upload /dev/stdin`으로 직접 파이프(값이 세션 컨텍스트나 화면에 출력되지 않도록 전 과정 로컬 로그 파일로 리다이렉트 후 즉시 파기, 길이 비교로만 검증). `binbang-worker`의 `AFFILIATE_AUDIT_ALERT_TELEGRAM_*` 5개는 서버에도 값이 없어 비어있음(Telegram 알림 미설정 상태로 추정 — 실제로 쓸 계획이면 별도로 채워야 함).
- [x] 각 project × config 조합으로 **read-only 서비스 토큰** 발급 완료 (`dev` config 토큰은 develop 배포용, `prd` config 토큰은 main 배포용). 토큰 값은 생성과 동시에 `gh secret set`으로 파이프해서 세션에 노출되지 않음.
- [x] GitHub repo의 Environment `main`/`develop`에 `DOPPLER_TOKEN_WEB`/`DOPPLER_TOKEN_WORKER`/`DOPPLER_TOKEN_TRAVEL` secret 등록 완료 (main엔 prd 토큰, develop엔 dev 토큰). 이 작업엔 fine-grained PAT에 Secrets + **Environments** 두 권한이 모두 필요했음(처음엔 Secrets만 있어서 environment secret 쓰기가 403이었음).
- [x] OCI 호스트에 Doppler CLI 설치 확인 완료 (v3.76.5, 2026-09-02에 미리 설치해둠 — 첫 배포 때 자동 설치 로직이 안 타도 됨)
- [ ] `develop` 브랜치에 이 변경을 먼저 push해서 dev 배포로 전체 흐름 검증 (컨테이너가 실제로 뜨는지, `/api/health` 200인지)
- [ ] 검증되면 서버의 구식 파일 정리:
   ```bash
   cd ~/workspace/binbang
   rm -f .env.common .env.production.local .env.development.local \
         .env.development.backup .env.development.bak.* .env.production.bak.* .env.production.local.bak.*
   rm -f apps/web/.env.common apps/web/.env.production apps/web/.env.development \
         apps/worker/.env.common apps/worker/.env.production apps/worker/.env.development \
         apps/travel/.env.common apps/travel/.env.production apps/travel/.env.development \
         apps/travel/.env.development.bak.*
   ```
   (`.env.production`/`.env.development` 루트 파일은 Doppler 값과 다시 한번 대조 후 삭제 — `pnpm db:migrate:deploy`가 더 이상 이 파일들을 읽지 않는지 확인)
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

- [ ] §3의 남은 체크박스 완료 (실제 값 입력 / 서비스 토큰 / GitHub secrets)
- [ ] develop 배포로 최소 1회 성공 검증
- [ ] `docker compose ... config`로 두 compose 파일이 `required: true`인 `.env.doppler.*` 파일을 정상적으로 찾는지 확인 (파일이 없으면 컨테이너가 아예 안 뜸 — 의도된 fail-fast)
- [ ] 롤백 계획: Doppler 다운로드가 실패하면 배포가 검증 전까지는 기존 수동 파일로 되돌릴 수 있도록, 서버 구식 파일 정리는 dev/main 모두 검증된 뒤에만 수행

## 5) 참고: Doppler CLI 공통 커맨드

```bash
# 서비스 토큰 발급 (read-only, CI용)
doppler configs tokens create ci-prd --project binbang-web --config prd --plain

# 로컬에서 다운로드해서 값 확인 (디버깅용, 화면에 secret이 출력되니 주의)
doppler secrets download --no-file --format env --project binbang-web --config prd

# 6개 project×config에 키가 몇 개 들어있는지 빠르게 확인
doppler secrets --project binbang-web --config prd --only-names
```

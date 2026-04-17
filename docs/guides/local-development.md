# Local Development

## 요구사항

- Node.js 24+
- pnpm 10.30.2+
- Docker / Docker Compose
- Oracle ADB 또는 접근 가능한 Oracle 개발 스키마
- Redis 6.2+ (로컬은 Docker로 실행 가능, 워커/BullMQ에 필요)
- 카카오 개발자 앱
- 구글 OAuth 클라이언트 (선택)

## 로컬 개발

RBAC/플랜/감사로그 변경사항 로컬 검증은 `docs/guides/rbac-local-testing.md`를 참고하세요.  
워커 큐/체크 처리의 내부 동작은 `docs/guides/worker-bullmq-runtime-flow.md`를 참고하세요.

### 방법 1: Oracle 외부 연결 + Redis만 Docker + 앱 네이티브 실행 (권장)

```bash
# 1) 의존성 설치
pnpm install

# 2) 환경변수 파일 준비
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local
cp apps/travel/.env.example apps/travel/.env.local
cp apps/worker/.env.example apps/worker/.env.local
# .env.local / apps/*/.env.local 값 채우기

# 3) Redis 실행
pnpm local:docker up -d redis

# 4) Oracle 스키마 반영
pnpm db:migrate
pnpm db:seed:base

# 5) 선택: 개발용 샘플 데이터
pnpm db:seed

# 6) 개발 서버 실행
pnpm dev:web     # http://localhost:3000
pnpm dev:travel  # http://localhost:3300
pnpm dev:worker  # 별도 터미널
```

#### `ORACLE_*` / `REDIS_URL` 설정 (중요)

루트 `.env.local`은 Oracle 연결과 공용 인증값을, 앱별 `.env.local`은 각 앱 전용 값을 가집니다.

```bash
# root .env.local
ORACLE_USER=BINBANG_DEV
ORACLE_PASSWORD=replace-with-oracle-password
ORACLE_CONNECT_STRING=tcps://your-adb-host:1522/your_service_name.adb.oraclecloud.com
ORACLE_AGODA_SHARED_SCHEMA=BINBANG_SHARED
REDIS_URL=redis://localhost:6379

# Docker 컨테이너 내부에서만 필요한 override
# REDIS_URL_DOCKER=redis://redis:6379
```

`ORACLE_CONNECT_STRING`은 Easy Connect Plus 형식(`tcps://` 또는 `tcp://`)을 사용합니다.  
`ORACLE_AGODA_SHARED_SCHEMA`는 공용 Agoda 카탈로그(`agoda_hotels`, `agoda_hotels_search`) 스키마 이름입니다.  
PG→Oracle 데이터 이관 리허설이 필요할 때만 `PG_SOURCE_DATABASE_URL`을 추가하세요.

### 방법 2: Docker로 web + worker + Redis 실행

현재 `docker/docker-compose.local.yml`은 PostgreSQL을 띄우지 않습니다. Oracle은 외부 스키마를 그대로 사용하고, 로컬 Compose는 `redis`, `web`, `worker`만 관리합니다.

```bash
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local
cp apps/worker/.env.example apps/worker/.env.local

pnpm local:docker up -d --build
pnpm db:migrate
pnpm db:seed:base
```

여행 앱은 필요하면 `pnpm dev:travel`로 네이티브 실행하세요.

## 환경변수

### 필수

| 변수 | 설명 |
| --- | --- |
| `ORACLE_USER` | Oracle 스키마 사용자 |
| `ORACLE_PASSWORD` | Oracle 스키마 비밀번호 |
| `ORACLE_CONNECT_STRING` | Oracle Easy Connect Plus 연결 문자열 |
| `ORACLE_AGODA_SHARED_SCHEMA` | 공용 Agoda 검색 스키마 이름 (기본값 `BINBANG_SHARED`) |
| `REDIS_URL` | Redis 연결 문자열 (워커 BullMQ 큐에 필요) |
| `NEXTAUTH_SECRET` | 세션 암호화 키 (`openssl rand -base64 32`) |
| `KAKAO_CLIENT_ID` | 카카오 REST API 키 |
| `KAKAO_CLIENT_SECRET` | 카카오 Client Secret |

### 앱별 필수

| 변수 | 설명 |
| --- | --- |
| `apps/web:NEXTAUTH_URL` | 운영 웹 로컬 URL |
| `apps/travel:NEXTAUTH_URL` | 여행 앱 로컬 URL |
| `apps/worker:BINBANG_INTERNAL_API_TOKEN` | worker ↔ web 내부 인증 토큰 |

### 선택

| 변수 | 설명 |
| --- | --- |
| `GOOGLE_CLIENT_ID` | 구글 OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | 구글 OAuth Client Secret |
| `PG_SOURCE_DATABASE_URL` | PostgreSQL 원본 DB 연결 문자열 (일회성 Oracle 이관용) |
| `REDIS_PORT` | Docker Redis 외부 포트 (기본 `6379`) |
| `WORKER_CONTROL_PORT` | 워커 내부 HTTP 서버 포트 (기본 `3500`) |

### Worker / 브라우저 / 체커 설정

Worker, 브라우저, 체커 관련 설정은 **관리자 페이지 > 설정**에서 DB로 관리됩니다.  
환경 변수는 기본 fallback만 담당하고, 운영 값은 Oracle `systemSettings`에서 읽습니다.

### 메모리 사용량 참고

브라우저 1개당 약 150~300MB를 사용합니다.

| RAM | 권장 브라우저 풀 크기 |
| --- | --- |
| 1GB | 1 |
| 2GB | 1~2 |
| 4GB | 2~3 |

## 주요 스크립트

```bash
# 개발
pnpm dev                      # web + worker + travel 동시 실행 (turbo)
pnpm dev:web                  # web만 실행
pnpm dev:travel               # travel만 실행
pnpm dev:worker               # worker만 실행
pnpm build                    # 프로덕션 빌드

# 코드 품질
pnpm lint                     # Biome 검사
pnpm lint:fix                 # Biome 자동 수정
pnpm format                   # Biome 포맷팅
pnpm format:check             # 포맷 검사
pnpm test                     # Vitest 테스트 실행
pnpm typecheck                # 타입 검사
pnpm ci:check                 # lint + typecheck + test + build

# 데이터베이스
pnpm db:migrate               # Oracle migration 적용
pnpm db:migrate:deploy        # Oracle migration 적용 (배포용)
pnpm --filter @workspace/db db:migrate:generate
pnpm db:seed                  # 개발용 seed 데이터 적용
pnpm db:seed:base             # 기준 seed 데이터 적용

# PG → Oracle 데이터 이관
pnpm tsx packages/db/scripts/migrate-pg-to-oracle.ts --dry-run
pnpm tsx packages/db/scripts/migrate-pg-to-oracle.ts --from=reference

# Docker 로컬 환경
pnpm local:docker up -d redis       # Redis만 실행
pnpm local:docker up -d --build     # web + worker + redis 실행
pnpm local:docker down              # 로컬 Docker 중지
```

## 테스트

```bash
# 전체 테스트 실행 (Turbo로 각 패키지 vitest 실행)
pnpm test

# 루트에서 vitest 직접 실행 (감시 모드)
pnpm vitest

# 커버리지
pnpm vitest --coverage
```

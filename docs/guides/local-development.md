# Local Development

## 요구사항

- Node.js 24+
- pnpm 10.28.0+
- Docker / Docker Compose
- PostgreSQL (로컬은 Docker로 실행 가능)
- Redis 6.2+ (로컬은 Docker로 실행 가능, BullMQ 큐에 필요)
- 카카오 개발자 앱
- 구글 OAuth 클라이언트 (선택)

## 로컬 개발

RBAC/플랜/감사로그 변경사항 로컬 검증은 `docs/guides/rbac-local-testing.md`를 참고하세요.
워커 큐/체크 처리의 내부 동작은 `docs/guides/worker-bullmq-runtime-flow.md`를 참고하세요.

### 방법 1: DB만 Docker + 앱 네이티브 실행 (권장)

```bash
# 1) 의존성 설치
pnpm install

# 2) 환경변수 파일 준비
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
# .env / apps/web/.env.local 값 채우기

# 3) DB + Redis 실행
pnpm local:docker up -d db redis

# 4) 마이그레이션 반영
pnpm db:migrate

# 5) 개발 서버 실행
pnpm dev:web     # http://localhost:3000
pnpm dev:worker  # 별도 터미널 (REDIS_URL 필요)
```

#### DATABASE_URL / REDIS_URL 설정 (중요)

`.env` 파일에서 `DATABASE_URL`과 `REDIS_URL`을 **localhost**로 설정해야 합니다.

```bash
# Docker Compose 내부용 (사용하지 마세요)
# DATABASE_URL=postgresql://postgres:postgres@db:5432/accommodation_monitor
# REDIS_URL=redis://redis:6379

# 로컬 네이티브 실행용 (이것을 사용하세요)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/accommodation_monitor
REDIS_URL=redis://localhost:6379
```

### 방법 2: Docker로 전체 실행 (web + worker + db)

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
# .env / apps/web/.env.local 값 채우기

pnpm local:docker up -d --build
pnpm db:migrate
```

## 환경변수

### 필수

| 변수                  | 설명                                       |
| --------------------- | ------------------------------------------ |
| `DATABASE_URL`        | PostgreSQL 연결 문자열                     |
| `REDIS_URL`           | Redis 연결 문자열 (워커 BullMQ 큐에 필요)  |
| `NEXTAUTH_URL`        | 서비스 URL                                 |
| `NEXTAUTH_SECRET`     | 세션 암호화 키 (`openssl rand -base64 32`) |
| `KAKAO_CLIENT_ID`     | 카카오 REST API 키                         |
| `KAKAO_CLIENT_SECRET` | 카카오 Client Secret                       |

### 선택 (OAuth)

| 변수                   | 설명                     |
| ---------------------- | ------------------------ |
| `GOOGLE_CLIENT_ID`     | 구글 OAuth Client ID     |
| `GOOGLE_CLIENT_SECRET` | 구글 OAuth Client Secret |

### Analytics / SEO

| 변수                                   | 설명                            |
| -------------------------------------- | ------------------------------- |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`        | Google Analytics 측정 ID        |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console 인증 코드 |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION`  | 네이버 서치어드바이저 인증 코드 |

### 시스템

| 변수                  | 설명                                | 기본값 |
| --------------------- | ----------------------------------- | ------ |
| `WORKER_CONTROL_PORT` | 워커 내부 HTTP 서버 포트            | 3500   |
| `REDIS_PORT`          | Docker Redis 외부 포트 (로컬)       | 6379   |
| `PRISMA_LOG_LEVEL`    | Prisma 로그 레벨 (query/warn/error) | warn   |

### Worker / 브라우저 / 체커 설정

Worker, 브라우저, 체커 관련 설정은 **관리자 페이지 > 설정**에서 DB로 관리됩니다.
환경 변수 없이도 DB에 저장된 기본값으로 동작하며, 관리자 UI에서 실시간 변경할 수 있습니다.

### 메모리 사용량 참고

브라우저 1개당 약 150~300MB를 사용합니다.

| RAM | 권장 브라우저 풀 크기 |
| --- | --------------------- |
| 1GB | 1                     |
| 2GB | 1~2                   |
| 4GB | 2~3                   |

## 주요 스크립트

```bash
# 개발
pnpm dev                      # web + worker 동시 실행 (turbo)
pnpm dev:web                  # web만 실행
pnpm dev:worker               # worker만 실행
pnpm build                    # 프로덕션 빌드

# 코드 품질
pnpm lint                     # ESLint 검사
pnpm lint:fix                 # ESLint 자동 수정
pnpm format                   # Prettier 포맷팅
pnpm format:check             # 포맷 검사
pnpm test                     # Vitest 테스트 실행
pnpm typecheck                # 타입 검사
pnpm ci:check                 # lint + typecheck + test + build

# 데이터베이스
pnpm db:generate              # Prisma Client 생성
pnpm db:migrate               # 마이그레이션 생성 (개발)
pnpm db:migrate:deploy        # 마이그레이션 적용 (프로덕션)
pnpm db:seed                  # 시드 데이터 적용
pnpm db:studio                # Prisma Studio

# Docker 로컬 환경
pnpm local:docker up -d --build   # 로컬 Docker 실행
pnpm local:docker down            # 로컬 Docker 중지
```

## 테스트

```bash
# 전체 테스트 실행
pnpm test

# 감시 모드
pnpm vitest

# 커버리지
pnpm vitest --coverage
```

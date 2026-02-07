# Accommodation Monitor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-24%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![CI](https://github.com/qorlgns1/accommodation-monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/qorlgns1/accommodation-monitor/actions/workflows/ci.yml)

Airbnb, Agoda 숙소의 **예약 가능 여부를 주기적으로 모니터링**하고, 예약이 가능해지면 **카카오톡으로 알림**을 보내주는 웹 애플리케이션입니다

> 인기 숙소의 취소 건을 잡기 위해 만들었습니다.

---

## 주요 기능

- **카카오 / 구글 소셜 로그인**
- **멀티 유저 지원** – 각자 자신의 숙소만 관리
- **숙소 CRUD** – UI로 등록 / 수정 / 삭제
- **자동 모니터링** – 기본 30분 주기 체크
- **카카오톡 알림** – 예약 가능 시 즉시 알림
- **체크 로그** – 모니터링 히스토리 확인
- **브라우저 풀** – Chromium 인스턴스 재사용으로 성능 최적화
- **관리자 설정** – Worker / 브라우저 / 체커 설정을 DB 기반 관리자 UI에서 실시간 변경
- **설정 변경 이력** – 누가 언제 어떤 설정을 변경했는지 감사 로그 확인
- **하트비트 모니터링** – 워커 생존 상태 추적, 이상 시 카카오 알림, 2시간 타임라인
- **워커 재시작** – 관리자 UI에서 원클릭 워커 재시작
- **사용자 관리** – 관리자가 사용자 목록 조회, 역할(Role) 변경
- **처리량 대시보드** – 체크 사이클 기반 처리량 추이/비교/요약 분석
- **체크 사이클 메트릭** – 사이클별 성공/에러/지속 시간/재시도 집계
- **API Rate Limiting** – IP 기반 슬라이딩 윈도우 요청 제한
- **동적 셀렉터 관리** – DB 기반 CSS 셀렉터/패턴 관리, 코드 배포 없이 플랫폼 UI 변경 대응
- **일관된 디자인 시스템** – shadcn/ui 기반의 모던한 UI

---

## 기술 스택

| 분류         | 기술                                                                            |
| :----------- | :------------------------------------------------------------------------------ |
| **Runtime**  | Node.js 24, pnpm 10.28.0                                                        |
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, TanStack React Query |
| **Backend**  | Next.js API Routes, Prisma ORM 7                                                |
| **Database** | PostgreSQL 15                                                                   |
| **Auth**     | NextAuth.js (카카오, 구글)                                                      |
| **Scraping** | Puppeteer                                                                       |
| **Worker**   | Node.js + node-cron                                                             |
| **CI/CD**    | GitHub Actions                                                                  |
| **Infra**    | Docker, AWS EC2, RDS                                                            |

---

## 요구사항

- Node.js 24+
- pnpm 10.28.0+
- Docker / Docker Compose
- PostgreSQL (로컬은 Docker로 자동 생성)
- 카카오 개발자 앱
- 구글 OAuth 클라이언트 (선택)

---

## 로컬 개발

RBAC/플랜/감사로그 변경사항 로컬 검증은 `docs/rbac-local-testing.md`를 참고하세요.

### 방법 1: DB만 Docker + 네이티브 실행 (권장)

Docker 전체 실행이 느릴 경우, **DB만 Docker로 실행**하고 Next.js는 네이티브로 실행합니다.

> 볼륨 마운트 오버헤드 없이 Hot Reload가 빠르며, macOS/Windows에서 특히 효과적입니다.

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경변수 설정
cp .env.example .env
# OAuth 키 및 NEXTAUTH_SECRET 입력

# 3. DB 컨테이너 실행
docker run -d \
  --name postgres-local \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=accommodation_monitor \
  -p 5432:5432 \
  postgres:15

# 4. Prisma 스키마 반영
pnpm db:push

# 5. 개발 서버 실행
pnpm dev        # 웹 서버 (http://localhost:3000)
pnpm cron       # 워커 (별도 터미널)
```

#### DATABASE_URL 설정 (중요)

`.env` 파일에서 `DATABASE_URL`을 **localhost**로 설정해야 합니다:

```bash
# Docker Compose 내부용 (사용하지 마세요)
# DATABASE_URL=postgresql://postgres:postgres@db:5432/accommodation_monitor

# 로컬 네이티브 실행용 (이것을 사용하세요)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/accommodation_monitor
```

> Docker Compose 내부에서는 서비스명(`db`)으로 접근하지만,
> 호스트(로컬 PC)에서 컨테이너로 접근할 때는 `localhost`를 사용해야 합니다.

### 방법 2: Docker로 전체 실행

Web / Worker / DB를 한 번에 실행합니다.

```bash
# 1. 프로젝트 클론
git clone https://github.com/qorlgns1/accommodation-monitor.git
cd accommodation-monitor

# 2. 환경변수 설정
cp .env.example .env
# OAuth 키 및 NEXTAUTH_SECRET 입력

# 3. Docker 실행
docker compose -f docker-compose.local.yml up --build

# 4. 브라우저 접속: http://localhost:3000
```

> **주의**: Docker 실행 시 **테이블(Prisma 스키마)은 자동으로 생성되지 않습니다.**
> 최초 실행 또는 스키마 변경 시 아래 명령을 실행하세요:
>
> ```bash
> pnpm local:docker:db:push
> ```

---

## 환경변수

### 필수

| 변수                  | 설명                                       |
| --------------------- | ------------------------------------------ |
| `DATABASE_URL`        | PostgreSQL 연결 문자열                     |
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

---

## CI/CD 파이프라인

### 워크플로우 구성

| 워크플로우      | 트리거                  | 설명                                    |
| --------------- | ----------------------- | --------------------------------------- |
| **CI**          | PR, push (main/develop) | lint, format, test, build 검증          |
| **CodeQL**      | PR, push, 주간 스케줄   | 보안 취약점 분석                        |
| **Deploy**      | develop/main push       | 브랜치별 Docker 이미지 빌드 및 EC2 배포 |
| **Release Tag** | main 브랜치 push        | package.json 버전으로 태그 자동 생성    |

### 필요한 GitHub Secrets

```text
DOCKERHUB_USERNAME    # Docker Hub 사용자명
DOCKERHUB_TOKEN       # Docker Hub 액세스 토큰
EC2_HOST              # EC2 퍼블릭 IP
EC2_USER              # EC2 SSH 사용자 (예: ubuntu)
EC2_SSH_KEY           # EC2 SSH 프라이빗 키
EC2_PORT              # SSH 포트 (기본: 22)
```

### 필요한 GitHub Variables

```text
NEXT_PUBLIC_GA_MEASUREMENT_ID         # Google Analytics 측정 ID
NEXT_PUBLIC_NAVER_SITE_VERIFICATION   # 네이버 사이트 인증
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION  # 구글 사이트 인증
```

---

## 운영 배포 (EC2 + RDS)

RDS가 SSL/TLS 검증을 요구하는 경우, **CA 번들을 컨테이너에 마운트하고**
`DATABASE_URL`에 `sslrootcert`를 지정해야 정상 연결됩니다.

### 1) EC2에 RDS CA 번들 다운로드

```bash
sudo mkdir -p /etc/ssl/rds
sudo curl -L "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem" \
  -o /etc/ssl/rds/global-bundle.pem
```

### 2) docker-compose에 CA 번들 마운트

`docker-compose.production.yml`에 아래 볼륨이 포함되어 있습니다:

```yml
volumes:
  - /etc/ssl/rds/global-bundle.pem:/etc/ssl/certs/rds-global-bundle.pem:ro
```

### 3) DATABASE_URL 설정 (sslrootcert 포함)

`.env`에 아래처럼 설정합니다:

```bash
DATABASE_URL=postgresql://username:password@your-rds-endpoint.amazonaws.com:5432/accommodation_monitor?sslmode=verify-full&sslrootcert=/etc/ssl/certs/rds-global-bundle.pem
```

> 비밀번호에 특수문자가 있으면 URL 인코딩이 필요합니다.
> 예: `@` → `%40`, `:` → `%3A`, `!` → `%21`

### 4) 수동 배포 (CI/CD 미사용 시)

```bash
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```

---

## 주요 스크립트

```bash
# 개발
pnpm dev                      # Next.js 개발 서버
pnpm cron                     # 워커 실행
pnpm build                    # 프로덕션 빌드

# 코드 품질
pnpm lint                     # ESLint 검사
pnpm lint:fix                 # ESLint 자동 수정
pnpm format                   # Prettier 포맷팅
pnpm format:check             # 포맷 검사
pnpm test                     # Vitest 테스트 실행

# 데이터베이스
pnpm db:generate              # Prisma Client 생성
pnpm db:push                  # 스키마 적용 (개발용)
pnpm db:migrate               # 마이그레이션 생성 (개발)
pnpm db:migrate:deploy        # 마이그레이션 적용 (프로덕션)
pnpm db:seed                  # 시드 데이터 적용 (개발용 전체)
pnpm db:seed:production       # 운영용 시드 (RBAC, 설정, 셀렉터/패턴만)
pnpm db:studio                # Prisma Studio

# Docker 로컬 환경
pnpm local:docker:up          # 로컬 Docker 실행
pnpm local:docker:up:build    # 빌드 후 실행
pnpm local:docker:down        # 로컬 Docker 중지
pnpm local:docker:db:push     # Docker 내 스키마 적용
pnpm local:docker:db:studio   # Docker 내 Prisma Studio
```

---

## 프로젝트 구조

```text
accommodation-monitor/
├── .github/
│   └── workflows/              # CI/CD 워크플로우
│       ├── ci.yml              # PR/push 검증
│       ├── codeql.yml          # 보안 분석
│       ├── deploy.yml          # develop/main 브랜치별 빌드·배포
│       └── release-tag.yml     # 자동 태그 생성
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   ├── login/              # 로그인 페이지
│   │   ├── dashboard/          # 대시보드
│   │   ├── admin/              # 관리자 (모니터링, 하트비트, 처리량, 설정, 사용자)
│   │   └── accommodations/     # 숙소 관리 (목록, 상세, 수정)
│   ├── components/             # React 컴포넌트
│   ├── generated/              # Prisma 생성 파일
│   ├── hooks/                  # React Query 커스텀 훅
│   ├── lib/
│   │   ├── auth.ts             # NextAuth 설정
│   │   ├── prisma.ts           # Prisma 클라이언트
│   │   ├── settings.ts         # 시스템 설정 로더 (DB → env → 기본값)
│   │   ├── selectors.ts        # 동적 셀렉터 캐시 모듈
│   │   ├── rateLimit.ts        # IP 기반 API Rate Limiting
│   │   ├── checkers/           # Airbnb, Agoda 체커
│   │   ├── heartbeat/          # 워커 하트비트 모니터링 및 히스토리
│   │   ├── kakao/              # 카카오톡 메시지
│   │   └── cron/               # 크론 워커 + 내부 HTTP 서버
│   ├── middleware.ts            # API Rate Limiting 미들웨어
│   └── types/                  # TypeScript 타입
├── prisma/
│   ├── schema.prisma           # DB 스키마
│   └── seed.ts                 # 시드 데이터
├── Dockerfile                  # 멀티스테이지 빌드 (web/worker)
├── docker-compose.local.yml    # 로컬 개발
├── docker-compose.develop.yml  # develop 브랜치
├── docker-compose.production.yml # 프로덕션
└── package.json
```

---

## 테스트

```bash
# 전체 테스트 실행
pnpm test

# 감시 모드
pnpm vitest

# 커버리지
pnpm vitest --coverage
```

---

## UI 개발 가이드

스타일 관리 방식이 `globals.css` 중심으로 운영됩니다.

- **Semantic 토큰 강제**: `bg-white` 대신 `bg-card`, `text-primary` 등 정의된 토큰을 사용해야 합니다.
- **컴포넌트 추가**: 새 UI 컴포넌트는 반드시 shadcn CLI를 통해 추가합니다.

  ```bash
  pnpm dlx shadcn@latest add [컴포넌트명] --overwrite
  ```

- **설정 금지**: `tailwind.config.ts`를 다시 생성하거나 사용하지 마십시오. 모든 스타일링은 CSS 변수를 통해 처리합니다.

---

## Contributing

- 버그 리포트나 기능 제안은 [Issues](https://github.com/qorlgns1/accommodation-monitor/issues)에 등록해주세요
- PR 전에 관련 이슈가 있는지 확인해주세요

---

## 버전 히스토리

### v2.11.0 – 동적 셀렉터 관리 시스템 (Latest)

플랫폼 UI 변경에 코드 배포 없이 대응할 수 있는 동적 셀렉터 관리 시스템을 추가했습니다.

- **DB 기반 셀렉터/패턴 관리**: `PlatformSelector`, `PlatformPattern` 모델로 CSS 셀렉터와 텍스트 패턴을 DB에서 관리
- **동적 Extractor 빌드**: DB 셀렉터 기반으로 JavaScript 추출 함수를 자동 생성
- **5분 TTL 캐시**: 성능 최적화를 위한 메모리 캐시, Fallback 로직으로 안정성 확보
- **어드민 UI**: `/admin/selectors`에서 플랫폼별 셀렉터/패턴 CRUD
- **변경 이력 추적**: `SelectorChangeLog` 모델로 모든 변경 감사 로그 기록
- **셀렉터 테스트 패널**: URL 입력 시 실시간 셀렉터 테스트 및 결과 미리보기
- **캐시 무효화 API**: 셀렉터 변경 후 즉시 반영을 위한 수동 캐시 무효화

#### 사용 방법

```bash
# 개발 환경
pnpm prisma migrate dev    # 마이그레이션 적용
pnpm db:seed               # 전체 시드 (테스트 데이터 포함)

# 운영 환경
pnpm db:migrate:deploy     # 마이그레이션 배포
pnpm db:seed:production    # 운영용 시드 (RBAC, 설정, 셀렉터/패턴만)

# 어드민에서 셀렉터 관리
# /admin/selectors 접속
```

#### 카테고리별 셀렉터

| 카테고리 | 설명 | 예시 |
|----------|------|------|
| `PRICE` | 가격 추출 | `[aria-label*="총액"]` |
| `AVAILABILITY` | 예약 가능/불가 요소 | `[data-element-value="unavailable"]` |
| `METADATA` | JSON-LD 등 메타데이터 | `script[type="application/ld+json"]` |
| `PLATFORM_ID` | 플랫폼 고유 ID | URL 패턴 또는 스크립트 |

#### 패턴 타입

| 타입 | 설명 | 예시 |
|------|------|------|
| `AVAILABLE` | 예약 가능 텍스트 | "예약하기", "Reserve" |
| `UNAVAILABLE` | 예약 불가 텍스트 | "날짜 변경", "not available" |

### v2.10.0 – 처리량 대시보드 및 체크 사이클 메트릭

체크 사이클 기준 처리량을 집계/시각화하는 관리 도구를 추가했습니다.

- **CheckCycle 모델**: 사이클별 시작/종료/지속시간, 성공/에러 수, 설정 스냅샷 저장
- **CheckLog 확장**: `cycleId`, `durationMs`, `retryCount`, `previousStatus` 추가
- **처리량 대시보드**: 요약 카드, 히스토리 라인 차트, 설정별 비교 바 차트
- **Throughput API**: `/api/admin/throughput/summary`, `/history`, `/compare`

### v2.9.0 – 관리자 시스템 구축, 보안 강화, CI/CD 통합

관리자 전용 시스템(모니터링·사용자 관리·설정), 워커 하트비트, API 보안을 전면적으로 구축했습니다.

- **관리자 모니터링 대시보드**: 워커 상태, DB 상태, 24시간 성공률 요약 카드 + 로그 타임라인 (필터·무한 스크롤)
- **사용자 관리**: 사용자 목록 조회, 역할(Role) 변경, 검색·필터·커서 페이지네이션
- **시스템 설정 env → DB 마이그레이션**: 7개 환경변수를 DB 기반으로 전환, 관리자 UI에서 실시간 변경, 변경 감사 로그
- **워커 하트비트**: 1분 단위 상태 기록, 워커 다운/처리 초과 감지 시 카카오 알림, 2시간 타임라인 UI
- **워커 재시작**: 내부 HTTP 서버(3500) + 관리자 원클릭 재시작 (Docker 자동 복구)
- **API Rate Limiting**: IP 기반 슬라이딩 윈도우 (auth: 10req/min, API: 60req/min)
- **CI/CD 통합**: deploy-prod + publish-dev → deploy.yml 단일 워크플로우, ARM64 전용
- **보안**: production 워커 포트 외부 노출 차단 (`expose`), 하트비트 API ADMIN 인증
- **Prisma Schema**: `Role` enum, `WorkerHeartbeat`, `HeartbeatHistory`, `SystemSettings`, `SettingsChangeLog` 모델 추가

### v2.8.0 – CI/CD 파이프라인 개선, 코드 품질 강화 및 Docker

빌드 최적화, 테스트 커버리지를 확대하고, CI/CD 파이프라인을 안정화하며, 빌드·배포 효율을 개선했습니다.

### v2.7.0 – TanStack Query 도입 및 데이터 관리/UX 대폭 개선

데이터 패칭을 React Query 중심으로 재정비해 실시간성/반응성/로딩 UX를 전반적으로 끌어올렸습니다.

- **TanStack React Query 도입**: `@tanstack/react-query` + Devtools 적용, `QueryClientProvider` 및 기본 캐시/재시도 정책 구성
- **전 페이지 fetch → Query 전환**: `useQuery`/`useMutation` 기반으로 일원화
- **커스텀 훅 패턴 도입**: `useAccommodations`, `useAccommodation`, `useCheckLogs`, `useRecentLogs`, `useCreate/Update/Delete/ToggleActive` 등
- **체크 로그 무한 스크롤**: `useInfiniteQuery` + cursor 기반 페이징, "더 보기" UI
- **Optimistic Update 적용**: 숙소 활성/일시정지 토글 즉시 반영 + 실패 시 rollback
- **대시보드 클라이언트화 + 자동 refetch**: 숙소 목록 30초, 최근 로그 60초 주기 갱신
- **부드러운 로딩 경험**: `placeholderData` + `keepPreviousData`로 화면 깜빡임 최소화
- **에러/상태 처리 일관화**: mutation pending 상태 통합 처리 및 에러 메시지 단일화
- **Query Key 체계화**: `queryKeys.ts`로 키 관리, 캐시 무효화 전략 개선

### v2.6.0 – Tailwind CSS v4 & shadcn/ui 도입

- **shadcn-ui(v3) 도입**: `components.json` 설정 및 `radix-vega` 스타일 적용
- **Tailwind CSS v4 마이그레이션**: `tailwind.config.ts` 삭제, `globals.css`로 설정 일원화
- OKLCH 색상 공간 기반의 semantic 토큰 및 다크 모드 변수 체계 구축

### v2.5.0 – 숙소 수정 페이지 추가

- **숙소 수정 페이지** (`/accommodations/[id]/edit`) 추가
- URL 변경 시 자동 파싱 및 "모두 적용" 기능

### v2.4.0 – CI/CD 파이프라인 및 인프라 현대화

- **Node.js 24** 업그레이드, **Prisma 7** 마이그레이션
- **GitHub Actions CI/CD** 파이프라인 구축
- Docker 멀티스테이지 빌드로 web/worker 통합
- Vitest 테스트 프레임워크 도입

### v2.3.0 – ESLint 9 + Prettier 설정

- ESLint 9 flat config (TypeScript strict, React Hooks, Next.js core-web-vitals)
- Prettier 설정 (싱글쿼트, 세미콜론, 줄 길이 120자, import 자동 정렬)

### v2.2.0 – Google Analytics 및 SEO

- Google Analytics 통합
- SEO 검증용 환경변수 추가

### v2.1.0 – 브라우저 풀 도입 및 성능 개선

체크마다 Chromium을 새로 띄우지 않고 **브라우저 풀을 통해 재사용**합니다.

- 4개 숙소 처리 시간: **40~50초 → 12~14초** (약 65~76% 단축)
- 브라우저 풀 기반 동시 처리, 리소스 차단, 타임아웃 최적화

### v2.0.0 – 웹 애플리케이션 전환

v1.x CLI 도구에서 완전히 재작성되었습니다.

| v1.x                  | v2.0.0                 |
| --------------------- | ---------------------- |
| CLI 기반              | 풀 웹 UI               |
| `config.js` 직접 편집 | 브라우저에서 숙소 관리 |
| 단일 사용자           | 멀티 유저 (OAuth)      |
| -                     | PostgreSQL + 체크 로그 |
| -                     | Docker Compose 배포    |

---

## Acknowledgments

- [Puppeteer](https://pptr.dev/) - 웹 스크래핑
- [Next.js](https://nextjs.org/) - React 프레임워크
- [Prisma](https://www.prisma.io/) - ORM
- [NextAuth.js](https://next-auth.js.org/) - 인증

---

## 라이센스

MIT License

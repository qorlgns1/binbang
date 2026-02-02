# 🏨 Accommodation Monitor

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-24%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![CI](https://github.com/qorlgns1/accommodation-monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/qorlgns1/accommodation-monitor/actions/workflows/ci.yml)
Airbnb, Agoda 숙소의 **예약 가능 여부를 주기적으로 모니터링**하고, 예약이 가능해지면 **카카오톡으로 알림**을 보내주는 웹 애플리케이션입니다.

> 인기 숙소의 취소 건을 잡기 위해 만들었습니다. 🇨🇭

---

## ✨ 주요 기능

- **카카오 / 구글 소셜 로그인**
- **멀티 유저 지원** – 각자 자신의 숙소만 관리
- **숙소 CRUD** – UI로 등록 / 수정 / 삭제
- **자동 모니터링** – 기본 30분 주기 체크
- **카카오톡 알림** – 예약 가능 시 즉시 알림
- **체크 로그** – 모니터링 히스토리 확인
- **브라우저 풀** – Chromium 인스턴스 재사용으로 성능 최적화
- **일관된 디자인 시스템** – shadcn/ui 기반의 모던한 UI

---

## 📦 버전 히스토리

### v2.6.0 – Tailwind CSS v4 & shadcn/ui 도입 (Latest)

프로젝트의 디자인 시스템을 현대화하고 유지보수 효율을 극대화했습니다.

- **shadcn-ui(v3) 도입**: `components.json` 설정 및 `radix-vega` 스타일 적용
- **Tailwind CSS v4 마이그레이션**:
  - `tailwind.config.ts`를 완전 삭제하고 `globals.css`로 설정 일원화
  - OKLCH 색상 공간 기반의 semantic 토큰 및 다크 모드 변수 체계 구축
  - `@tailwindcss/postcss` 적용 및 `autoprefixer` 제거
- **UI 컴포넌트 추가**: Radix UI 기반의 `Input`, `Label` 컴포넌트 신규 생성
- **문서화 강화**: `CLAUDE.md`에 UI 컴포넌트 가이드 및 스타일 규칙(하드코딩 금지 등) 추가

### v2.5.0 – 숙소 수정 페이지 추가

- **숙소 수정 페이지** (`/accommodations/[id]/edit`) 추가
  - 숙소 이름, URL, 체크인/아웃, 인원 수정
  - URL 변경 시 자동 파싱 및 "모두 적용" 기능
- 상세 페이지에 **수정** 버튼 추가
- 상태 표시 로직 리팩토링 (`getStatusColor`, `getStatusLabel`)

### v2.4.0 – CI/CD 파이프라인 및 인프라 현대화

- **Node.js 24** 업그레이드
- **Prisma 7** 마이그레이션 (pg 어댑터 사용)
- **GitHub Actions CI/CD** 파이프라인 구축
- Docker 멀티스테이지 빌드로 web/worker 통합
- Vitest 테스트 프레임워크 도입
- Dependabot 자동 의존성 관리

**Breaking Change**: Prisma 클라이언트 경로가 `@/generated/prisma`로 변경됨

### v2.3.1 – import 누락 수정

- **버그 수정**: `layout.tsx` import 정렬 시 누락된 import 복구
  - `./globals.css`
  - `@/components/providers`

### v2.3.0 – ESLint 9 + Prettier 설정

코드 품질 및 일관성 강화를 위한 린트/포맷팅 도구 설정.

**새로운 기능**

- **ESLint 9 flat config**
  - TypeScript strict 규칙 적용
  - React/React Hooks 규칙 적용
  - Next.js core-web-vitals 규칙 적용
  - 상위 폴더 상대경로 import 금지 (`../` → `@/` 강제)
- **Prettier 설정**
  - 싱글쿼트, 세미콜론, 줄 길이 120자
  - JSX 속성 한 줄에 하나씩
  - import 자동 정렬 (react → next → 외부 → @/ → ./)

**코드 개선**

- non-null assertion(`!`) 제거 → 안전한 null 체크로 변경
- `import type` 일관 적용
- 전체 코드 Prettier 포맷팅 적용

**새로운 npm scripts**

| 스크립트       | 설명             |
| -------------- | ---------------- |
| `lint`         | ESLint 실행      |
| `lint:fix`     | ESLint 자동 수정 |
| `format`       | Prettier 포맷팅  |
| `format:check` | Prettier 검사    |

### v2.2.0 – Google Analytics 및 SEO

- Google Analytics 통합
- SEO 검증용 환경변수 추가

**신규 환경변수**: `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_NAVER_SITE_VERIFICATION`

### v2.1.0 – 브라우저 풀 도입 및 성능 개선

체크마다 Chromium을 새로 띄우지 않고 **브라우저 풀을 통해 재사용**합니다.

**성능 개선**

- 4개 숙소 처리 시간: **40~50초 → 12~14초** (약 65~76% 단축)

**주요 변경 사항**

| 항목           | 내용                                                                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🏊 브라우저 풀 | `browserPool.ts` 신규 생성, 동시 처리 수를 풀 크기로 자동 제한해 메모리 폭주 방지                                                                     |
| ⚡ 체크 로직   | `waitUntil: "domcontentloaded"` 전환, `CONTENT_WAIT_MS` 대기 후 `PATTERN_RETRY_MS` 간격으로 1회 재확인 (CSR 렌더 대응), 패턴 미탐지 시 `ERROR`로 기록 |
| ⏱️ 타임아웃    | `NAVIGATION_TIMEOUT_MS` 기본값 25초로 단축, Navigation timeout 발생 시 재시도 제외                                                                    |
| 🚫 리소스 차단 | `BLOCK_RESOURCE_TYPES` 환경변수로 이미지/미디어/폰트 요청 차단 (옵션)                                                                                 |

**신규 환경변수**: `BROWSER_POOL_SIZE`, `BLOCK_RESOURCE_TYPES`, `NAVIGATION_TIMEOUT_MS`, `CONTENT_WAIT_MS`, `PATTERN_RETRY_MS`

### v2.0.0 – 웹 애플리케이션 전환

> v1.x CLI 도구에서 완전히 재작성되었습니다.

| v1.x                  | v2.0.0                 |
| --------------------- | ---------------------- |
| CLI 기반              | 풀 웹 UI               |
| `config.js` 직접 편집 | 브라우저에서 숙소 관리 |
| 단일 사용자           | 멀티 유저 (OAuth)      |
| -                     | PostgreSQL + 체크 로그 |
| -                     | Docker Compose 배포    |

---

## 🛠 기술 스택

| 분류         | 기술                                                      |
| :----------- | :-------------------------------------------------------- |
| **Runtime**  | Node.js 24, pnpm 10.28.0                                  |
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend**  | Next.js API Routes, Prisma ORM 7                          |
| **Database** | PostgreSQL 15                                             |
| **Auth**     | NextAuth.js (카카오, 구글)                                |
| **Scraping** | Puppeteer                                                 |
| **Worker**   | Node.js + node-cron                                       |
| **CI/CD**    | GitHub Actions                                            |
| **Infra**    | Docker, AWS EC2, RDS                                      |

---

## 📋 요구사항

- Node.js 24+
- pnpm 10.28.0+
- Docker / Docker Compose
- PostgreSQL (로컬은 Docker로 자동 생성)
- 카카오 개발자 앱
- 구글 OAuth 클라이언트 (선택)

---

## 🎨 UI 개발 가이드 (v2.6.0+)

v2.6.0부터 스타일 관리 방식이 `globals.css` 중심으로 변경되었습니다.

- **Semantic 토큰 강제**: `bg-white` 대신 `bg-card`, `text-primary` 등 정의된 토큰을 사용해야 합니다.
- **컴포넌트 추가**: 새 UI 컴포넌트는 반드시 shadcn CLI를 통해 추가합니다.
  ```bash
  pnpm dlx shadcn@latest add [컴포넌트명] --overwrite
  ```
- **설정 금지**: `tailwind.config.ts`를 다시 생성하거나 사용하지 마십시오. 모든 스타일링은 CSS 변수를 통해 처리합니다.

## 🚀 CI/CD 파이프라인

### 워크플로우 구성

| 워크플로우      | 트리거                    | 설명                                 |
| --------------- | ------------------------- | ------------------------------------ |
| **CI**          | PR, push (main/develop)   | lint, format, test, build 검증       |
| **CodeQL**      | PR, push, 주간 스케줄     | 보안 취약점 분석                     |
| **Publish Dev** | develop 브랜치 CI 성공 시 | Docker Hub에 dev 이미지 푸시         |
| **Release Tag** | main 브랜치 push          | package.json 버전으로 태그 자동 생성 |
| **Deploy Prod** | 태그 push (v\*)           | 프로덕션 빌드 및 EC2 자동 배포       |

### 필요한 GitHub Secrets

```
DOCKERHUB_USERNAME    # Docker Hub 사용자명
DOCKERHUB_TOKEN       # Docker Hub 액세스 토큰
EC2_HOST              # EC2 퍼블릭 IP
EC2_USER              # EC2 SSH 사용자 (예: ubuntu)
EC2_SSH_KEY           # EC2 SSH 프라이빗 키
EC2_PORT              # SSH 포트 (기본: 22)
```

### 필요한 GitHub Variables

```
NEXT_PUBLIC_GA_MEASUREMENT_ID         # Google Analytics 측정 ID
NEXT_PUBLIC_NAVER_SITE_VERIFICATION   # 네이버 사이트 인증
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION  # 구글 사이트 인증
```

---

## 🚀 운영 배포 (EC2 + RDS, TLS)

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

## 🔄 CI/CD 파이프라인

### 워크플로우 구성

| 워크플로우      | 트리거                    | 설명                                 |
| --------------- | ------------------------- | ------------------------------------ |
| **CI**          | PR, push (main/develop)   | lint, format, test, build 검증       |
| **CodeQL**      | PR, push, 주간 스케줄     | 보안 취약점 분석                     |
| **Publish Dev** | develop 브랜치 CI 성공 시 | Docker Hub에 dev 이미지 푸시         |
| **Release Tag** | main 브랜치 push          | package.json 버전으로 태그 자동 생성 |
| **Deploy Prod** | 태그 push (v\*)           | 프로덕션 빌드 및 EC2 자동 배포       |

### 필요한 GitHub Secrets

```
DOCKERHUB_USERNAME    # Docker Hub 사용자명
DOCKERHUB_TOKEN       # Docker Hub 액세스 토큰
EC2_HOST              # EC2 퍼블릭 IP
EC2_USER              # EC2 SSH 사용자 (예: ubuntu)
EC2_SSH_KEY           # EC2 SSH 프라이빗 키
EC2_PORT              # SSH 포트 (기본: 22)
```

### 필요한 GitHub Variables

```
NEXT_PUBLIC_GA_MEASUREMENT_ID         # Google Analytics 측정 ID
NEXT_PUBLIC_NAVER_SITE_VERIFICATION   # 네이버 사이트 인증
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION  # 구글 사이트 인증
```

---

## 🚀 운영 배포 (EC2 + RDS)

RDS가 SSL/TLS 검증을 요구하는 경우, **CA 번들을 컨테이너에 마운트**해야 합니다.

### 1) EC2에 RDS CA 번들 다운로드

```bash
sudo mkdir -p /etc/ssl/rds
sudo curl -L "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem" \
  -o /etc/ssl/rds/global-bundle.pem
```

### 2) DATABASE_URL 설정

```bash
DATABASE_URL=postgresql://username:password@your-rds-endpoint.amazonaws.com:5432/accommodation_monitor?sslmode=verify-full&sslrootcert=/etc/ssl/certs/rds-global-bundle.pem
```

> 비밀번호에 특수문자가 있으면 URL 인코딩 필요: `@` → `%40`, `:` → `%3A`

### 3) 수동 배포 (CI/CD 미사용 시)

```bash
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d
```

---

## 🚀 로컬 개발

### 권장 방식: Docker로 전체 실행

> 이 방식은 **로컬 개발 전용**이며,  
> Web / Worker / DB를 한 번에 실행합니다.

#### ✔️ 이 방식으로 얻는 것

- ✅ PostgreSQL 컨테이너 자동 생성
- ✅ DB가 없으면 빈 데이터베이스 자동 생성
- ✅ DB가 있으면 기존 데이터 그대로 재사용
- ✅ Web / Worker / DB 한 번에 실행

> ⚠️ **주의**  
> Docker 실행 시 **테이블(Prisma 스키마)은 자동으로 생성되지 않습니다.**  
> 최초 실행 또는 스키마 변경 시 **Prisma 명령을 직접 실행해야 합니다.**

#### ▶ 실행 방법

```bash
# 1. 프로젝트 클론
git clone https://github.com/qorlgns1/accommodation-monitor.git
cd accommodation-monitor

# 2. 환경변수 설정
cp .env.example .env
# OAuth 키 및 NEXTAUTH_SECRET 입력

# 3. Docker 실행
docker compose -f docker-compose.local.yml up --build

# 4. 브라우저 접속
http://localhost:3000
```

### Docker 없이 로컬 실행 (권장)

#### ▶ Prisma 스키마 반영 (필수)

최초 실행 시 또는 `schema.prisma` 변경 후 반드시 실행:

```bash
pnpm local:docker:db:push
```

- 테이블 / 인덱스 / 관계 생성
- 기존 데이터는 삭제하지 않음

# 5. 브라우저 접속

open http://localhost:3000

````

### Docker 없이 로컬 실행

| 항목                 | 자동 여부                   |
| -------------------- | --------------------------- |
| PostgreSQL 컨테이너  | ✅ 자동                     |
| 빈 데이터베이스 생성 | ✅ 자동                     |
| 기존 DB 재사용       | ✅ 자동                     |
| Prisma 테이블 생성   | ❌ 수동                     |
| Prisma 명령          | `pnpm local:docker:db:push` |

### 🧑‍💻 Docker 없이 로컬 실행 (권장)

Docker 전체 실행이 느릴 경우, **DB만 Docker로 실행**하고 Next.js는 네이티브로 실행할 수 있습니다.

> 💡 **이 방식의 장점**
>
> - 볼륨 마운트 오버헤드 없음 → 훨씬 빠른 개발 경험
> - Hot Reload 속도 향상
> - macOS/Windows에서 특히 효과적

#### ▶ 실행 방법

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경변수 설정
cp .env.example .env
````

#### ▶ DATABASE_URL 설정 (중요!)

`.env` 파일에서 `DATABASE_URL`을 **localhost**로 설정해야 합니다:

```bash
# ⚠️ Docker Compose 내부용 (사용하지 마세요)
# DATABASE_URL=postgresql://postgres:postgres@db:5432/accommodation_monitor

# ✅ 로컬 네이티브 실행용 (이것을 사용하세요)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/accommodation_monitor
```

> **왜 `localhost`인가요?**
> Docker Compose 내부에서는 서비스명(`db`)으로 접근하지만,
> 호스트(로컬 PC)에서 컨테이너로 접근할 때는 `localhost`를 사용해야 합니다.

#### ▶ DB 컨테이너 실행

```bash
# DB만 Docker로 실행
docker run -d \
  --name postgres-local \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=accommodation_monitor \
  -p 5432:5432 \
  postgres:15

# 3. .env에서 DATABASE_URL을 localhost로 설정
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/accommodation_monitor

# 4. Prisma 스키마 반영
pnpm db:push

# 5. 개발 서버 실행
pnpm dev        # 웹 서버 (http://localhost:3000)
pnpm cron       # 워커 (별도 터미널)
```

# 3. .env에서 DATABASE_URL을 localhost로 설정

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/accommodation_monitor_local

```bash
# 테이블 생성
pnpm db:push

# 또는 완전히 새로 만들고 싶을 때 (기존 데이터 삭제)
pnpm db:push --force-reset
```

### OAuth Redirect URI 설정

```bash
pnpm dev        # 웹 서버 (http://localhost:3000)
pnpm cron       # 워커 (별도 터미널에서)
```

---

## 🔧 환경변수

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

### Worker 설정

| 변수                 | 설명              | 기본값         |
| -------------------- | ----------------- | -------------- |
| `CRON_SCHEDULE`      | 실행 주기 (cron)  | `*/30 * * * *` |
| `WORKER_CONCURRENCY` | 동시 처리 숙소 수 | `1`            |
| `BROWSER_POOL_SIZE`  | 브라우저 풀 크기  | `1`            |

### 브라우저/체커 설정 (v2.1.0+)

| 변수                    | 설명                           | 기본값             |
| ----------------------- | ------------------------------ | ------------------ |
| `NAVIGATION_TIMEOUT_MS` | 네비게이션 타임아웃 (ms)       | `25000`            |
| `CONTENT_WAIT_MS`       | 콘텐츠 로딩 대기 시간 (ms)     | `10000`            |
| `PATTERN_RETRY_MS`      | 패턴 재확인 대기 시간 (ms)     | `5000`             |
| `BLOCK_RESOURCE_TYPES`  | 차단할 리소스 타입 (쉼표 구분) | `image,media,font` |

### Analytics / SEO (v2.2.0+)

| 변수                       | 설명                            |
| -------------------------- | ------------------------------- |
| `NEXT_PUBLIC_GA_ID`        | Google Analytics 측정 ID        |
| `GOOGLE_SITE_VERIFICATION` | Google Search Console 인증 코드 |
| `NAVER_SITE_VERIFICATION`  | 네이버 서치어드바이저 인증 코드 |

### 메모리 사용량 참고

브라우저 1개당 약 150~300MB를 사용합니다.

| RAM | 권장 `BROWSER_POOL_SIZE` |
| --- | ------------------------ |
| 2GB | 1~2                      |
| 4GB | 2~3                      |

---

## 🔧 환경변수

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

### Worker 설정

| 변수                 | 설명              | 기본값         |
| -------------------- | ----------------- | -------------- |
| `CRON_SCHEDULE`      | 실행 주기 (cron)  | `*/30 * * * *` |
| `WORKER_CONCURRENCY` | 동시 처리 숙소 수 | `1`            |
| `BROWSER_POOL_SIZE`  | 브라우저 풀 크기  | `1`            |

### 브라우저/체커 설정

| 변수                    | 설명                           | 기본값             |
| ----------------------- | ------------------------------ | ------------------ |
| `NAVIGATION_TIMEOUT_MS` | 네비게이션 타임아웃 (ms)       | `25000`            |
| `CONTENT_WAIT_MS`       | 콘텐츠 로딩 대기 시간 (ms)     | `10000`            |
| `PATTERN_RETRY_MS`      | 패턴 재확인 대기 시간 (ms)     | `5000`             |
| `BLOCK_RESOURCE_TYPES`  | 차단할 리소스 타입 (쉼표 구분) | `image,media,font` |

### Analytics / SEO

| 변수                                   | 설명                            |
| -------------------------------------- | ------------------------------- |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`        | Google Analytics 측정 ID        |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console 인증 코드 |
| `NEXT_PUBLIC_NAVER_SITE_VERIFICATION`  | 네이버 서치어드바이저 인증 코드 |

### 메모리 사용량 참고

브라우저 1개당 약 150~300MB를 사용합니다.

| RAM | 권장 `BROWSER_POOL_SIZE` |
| --- | ------------------------ |
| 1GB | 1                        |
| 2GB | 1~2                      |
| 4GB | 2~3                      |

---

## 📜 주요 스크립트

```bash
# 개발
pnpm dev                      # Next.js 개발 서버
pnpm cron                     # 워커 실행
pnpm build                    # 프로덕션 빌드

# 코드 품질
pnpm lint                     # ESLint 검사
pnpm format                   # Prettier 포맷팅
pnpm test                     # Vitest 테스트 실행

# 데이터베이스
pnpm db:push                  # 스키마 적용 (개발용)
pnpm db:migrate               # 마이그레이션 생성
pnpm db:studio                # Prisma Studio

# Docker 로컬 환경
pnpm local:docker:up          # 로컬 Docker 실행
pnpm local:docker:db:push     # Docker 내 스키마 적용
```

---

## 📁 프로젝트 구조

```
accommodation-monitor/
├── .github/
│   └── workflows/              # CI/CD 워크플로우
│       ├── ci.yml              # PR/push 검증
│       ├── codeql.yml          # 보안 분석
│       ├── publish-dev.yml     # dev 이미지 빌드
│       ├── release-tag.yml     # 자동 태그 생성
│       └── deploy-prod.yml     # 프로덕션 배포
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   ├── login/              # 로그인 페이지
│   │   ├── dashboard/          # 대시보드
│   │   └── accommodations/     # 숙소 관리 (목록, 상세, 수정)
│   ├── components/             # React 컴포넌트
│   ├── generated/              # Prisma 생성 파일
│   ├── lib/
│   │   ├── auth.ts         # NextAuth 설정
│   │   ├── prisma.ts       # Prisma 클라이언트
│   │   ├── checkers/       # Airbnb, Agoda 체커
│   │   ├── kakao/          # 카카오톡 메시지
│   │   └── cron/           # 크론 워커
│   └── types/              # TypeScript 타입
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

## 🤝 Contributing

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
pnpm db:seed                  # 시드 데이터 적용
pnpm db:studio                # Prisma Studio

# Docker 로컬 환경
pnpm local:docker:up          # 로컬 Docker 실행
pnpm local:docker:up:build    # 빌드 후 실행
pnpm local:docker:down        # 로컬 Docker 중지
pnpm local:docker:db:push     # Docker 내 스키마 적용
pnpm local:docker:db:studio   # Docker 내 Prisma Studio
```

### 이슈 & PR

- 버그 리포트나 기능 제안은 [Issues](https://github.com/qorlgns1/accommodation-monitor/issues)에 등록해주세요
- PR 전에 관련 이슈가 있는지 확인해주세요

---

## 📄 라이센스

| 변수                   | 설명                       |
| ---------------------- | -------------------------- |
| `DATABASE_URL`         | PostgreSQL 연결 문자열     |
| `NEXTAUTH_URL`         | 서비스 URL                 |
| `NEXTAUTH_SECRET`      | 세션 암호화 키             |
| `GOOGLE_CLIENT_ID`     | 구글 OAuth                 |
| `GOOGLE_CLIENT_SECRET` | 구글 OAuth                 |
| `KAKAO_CLIENT_ID`      | 카카오 REST API 키         |
| `KAKAO_CLIENT_SECRET`  | 카카오 Client Secret       |
| `CRON_SCHEDULE`        | 워커 실행 주기 (기본 30분) |
| `WORKER_CONCURRENCY`   | 동시 처리 숙소 수          |
| `BROWSER_POOL_SIZE`    | 브라우저 풀 크기           |

---

## 🧪 테스트

```bash
# 전체 테스트 실행
pnpm test

# 감시 모드
pnpm vitest

# 커버리지
pnpm vitest --coverage
```

---

## 🙏 Acknowledgments

- [Puppeteer](https://pptr.dev/) - 웹 스크래핑
- [Next.js](https://nextjs.org/) - React 프레임워크
- [Prisma](https://www.prisma.io/) - ORM
- [NextAuth.js](https://next-auth.js.org/) - 인증

```

```

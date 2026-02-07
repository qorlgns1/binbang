# 🔒 추가 컨텍스트 (Claude 작업 가이드 확장)

> 이 섹션은 Claude가 **운영 환경·성능 제약·아키텍처 의도를 오해하지 않도록** 하기 위한 보조 규칙입니다.  
> 기존 문서의 규칙보다 **우선 적용**됩니다.

---

## 🧭 의사결정 우선순위

모든 코드 변경, 리팩토링, 기능 제안은 아래 우선순위를 **반드시** 따른다.

1. **운영 안정성** (운영 환경에서 프로세스가 죽지 않는 것)
2. **메모리 / CPU 사용량 최소화**
3. **데이터 정합성**
   - 중복 체크 방지
   - 중복 알림 방지
4. **개발 편의성 / 가독성**
5. **기능 확장**

> ⚠️ 성능/안정성을 희생하면서 얻는 DX 개선이나 추상화는 허용하지 않는다.

---

## ⛔ 금지 사항 (운영 / 비용 / 보안)

### Docker / Infra

- production 환경에서 `docker compose`에 `build:` 사용 ❌  
  → **항상 image + digest 고정**

### Worker / Puppeteer

- 새 Chromium 인스턴스를 매 작업마다 생성 ❌
- 페이지/브라우저 close 누락 ❌

### Prisma / DB

- `src/generated/**` 파일 직접 수정 ❌
- Prisma import 경로 혼용 ❌
  (`@prisma/client` 사용 금지, `@/generated/prisma/client`만 허용)
- DB 연결 보안 하향 (`sslmode=require`, `prefer` 등) 제안 ❌
- `prisma db push` 사용 ❌ → **`prisma migrate dev`만 사용**
- 이미 배포된 migration 파일 수정/삭제 ❌
- migration SQL 직접 작성 ❌ → `migrate dev`로 자동 생성

### 보안

- 시크릿 / 토큰 / 키를 문서나 코드 예시에 그대로 작성 ❌
  (항상 마스킹 또는 placeholder 사용)
- production에서 워커 제어 포트를 `ports`로 호스트에 노출 ❌
  → `expose`만 사용 (Docker 내부 네트워크에서만 접근)
- 관리자 전용 API에 인증 누락 ❌
  → `getServerSession` + ADMIN role 체크 필수

### UI / 스타일

- Tailwind legacy 클래스 하드코딩 금지 (`gray-`, `blue-500`, `primary-600` 등) ❌
- `tailwind.config.ts` 파일 생성/사용 금지 ❌

---

## 🗺️ 기능별 코드 위치 가이드

기능 변경 시 **아래 엔트리 포인트부터 확인**한다.

### 인증 / 세션 (NextAuth.js v4)

- 설정: `src/lib/auth.ts`
- API: `src/app/api/auth/*`

### 숙소 관리 (CRUD)

- API: `src/app/api/accommodations/*`
- 페이지: `src/app/accommodations/*`

### 워커 / 크론

- 엔트리 포인트: `src/lib/cron/worker.ts`
- 처리 흐름: `worker.ts` → `processor.ts` → `checkers/*`
- 내부 HTTP 서버: `worker.ts` 하단 (`/health`, `/restart` 엔드포인트, 포트 3500)
- 재시작 API: `src/app/api/worker/restart/route.ts` (ADMIN 인증 → 워커 HTTP로 전달)

### 체커 (Scraping)

- 공통 로직: `src/lib/checkers/baseChecker.ts`
- 플랫폼별:
  - Airbnb: `src/lib/checkers/airbnb.ts`
  - Agoda: `src/lib/checkers/agoda.ts`
- 브라우저 관리: `src/lib/checkers/browserPool.ts`

### 하트비트 모니터링

- 핵심 모듈: `src/lib/heartbeat/index.ts` (업데이트, 모니터링, 알림)
- 히스토리: `src/lib/heartbeat/history.ts` (기록, 조회, 24시간 자동 정리)
- API: `src/app/api/health/heartbeat/route.ts`, `src/app/api/heartbeat/history/route.ts`
- 페이지: `src/app/admin/heartbeat/page.tsx`
- 타임라인: `src/app/admin/heartbeat/_components/HeartbeatTimeline.tsx`

### 처리량(Throughput) 모니터링

- API: `src/app/api/admin/throughput/summary/route.ts`, `src/app/api/admin/throughput/history/route.ts`, `src/app/api/admin/throughput/compare/route.ts`
- Hooks: `src/hooks/useThroughputSummary.ts`, `src/hooks/useThroughputHistory.ts`, `src/hooks/useThroughputComparison.ts`
- Query Keys: `src/hooks/queryKeys.ts` (adminKeys.throughput\*)
- 페이지/UI: `src/app/admin/throughput/page.tsx`, `src/app/admin/throughput/_components/*`

### 알림

- 카카오 메시지: `src/lib/kakao/*`

### DB / ORM

- Prisma Client: `src/lib/prisma.ts`
- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`
- 설정: `prisma.config.ts`
- 체크 사이클: `CheckCycle` 모델 + `CheckLog` 확장 필드 (cycleId, durationMs, retryCount, previousStatus)

### Prisma Migrate 워크플로우

스키마 변경은 **반드시 `prisma migrate dev`로 마이그레이션을 생성**하고, 서버에서는 worker 시작 시 `prisma migrate deploy`가 자동 실행된다.

**로컬 개발 (마이그레이션 생성)**

```bash
# 1. prisma/schema.prisma 수정
# 2. 마이그레이션 생성 + 로컬 DB 적용
pnpm prisma migrate dev --name 변경내용

# SQL만 생성하고 적용은 나중에 하려면
pnpm prisma migrate dev --name 변경내용 --create-only
# → SQL 확인/수정 후
pnpm prisma migrate dev
```

**서버 배포 (자동)**

- Worker Dockerfile CMD: `pnpm db:migrate:deploy && pnpm cron`
- 컨테이너 시작 시 새 마이그레이션만 자동 적용, 이미 적용된 것은 skip

**규칙**

- `prisma/migrations/` 폴더는 **반드시 git에 커밋**한다
- 이미 적용된(서버에 배포된) migration 파일은 **수정/삭제 금지**
- `db push`는 **사용하지 않는다** (migrate와 혼용 금지)
- migration SQL 파일을 직접 작성하지 않는다 (`migrate dev`로 생성)

### Rate Limiting / 미들웨어

- 미들웨어: `src/middleware.ts` (API 경로별 rate limit 적용)
- Rate Limiter: `src/lib/rateLimit.ts` (in-memory 슬라이딩 윈도우)
- 테스트: `src/lib/rateLimit.test.ts`

### UI 컴포넌트

- 모든 shadcn-ui 컴포넌트: `src/components/ui/*`
- 공통 유틸: `@/lib/utils` (특히 `cn`)

### 데이터 패칭 (TanStack Query v5)

- Provider: `src/components/providers.tsx` (`QueryClientProvider`, Devtools 포함)
- Query Key: `src/hooks/queryKeys.ts`

> Client 컴포넌트의 데이터 패칭은 **반드시 React Query 훅**으로 수행한다.  
> 페이지/컴포넌트에서 `fetch`를 직접 호출하지 않는다.

**키/캐시 규칙**

- query key는 `queryKeys.ts`의 팩토리 함수만 사용한다 (인라인 배열 금지)
- 캐시 무효화는 **해당 도메인 범위로 최소화**한다 (전체 clear 금지)
- 기본 캐시 옵션은 `providers.tsx`를 따른다 (staleTime/gcTime/retry 등)

---

## 🎨 UI 컴포넌트 가이드 (shadcn v3 + Tailwind v4)

UI는 **shadcn v3 스타일 + Tailwind v4** 기준으로 **엄격히 통일**한다.

### 기본 원칙

- 컴포넌트는 `src/components/ui/*` **외부에 절대 생성하지 않는다**.
- Tailwind v4 **semantic 토큰 기반 클래스만 사용**  
  → `bg-card`, `text-muted-foreground`, `border-border`, `text-primary`, `ring-ring` 등  
  → **절대** `bg-blue-500`, `text-gray-700`, `border-red-400`, `primary-600` 같은 legacy/하드코딩 색상 사용 금지
- 공용 유틸: `cn`은 **반드시** `@/lib/utils`에서 가져온다.
- Radix 프리미티브는 **`radix-ui`** 패키지에서 import  
  (예: `import * as LabelPrimitive from '@radix-ui/react-label'`)

### 새 컴포넌트 추가/업데이트

```bash
pnpm dlx shadcn@latest add <component> --overwrite
```

- 추가 전 components.json의 style, baseColor 등 설정 확인
- --overwrite 사용 시 반드시 git diff로 기존 커스텀 내용 확인 후 진행

### 커스텀 규칙

- 새 variant/size가 필요하면 해당 컴포넌트의 `cva`에 추가한다.
- UI 변경 시 **API 변경(variant/prop 추가/변경) 허용**.
- Tailwind 설정 파일(`tailwind.config.ts`)은 **사용하지 않음**.  
  스타일 토큰은 `src/app/globals.css`에서 관리한다.

---

## 🌱 환경별 실행 규칙

### Local (`docker-compose.local.yml`)

- 목적: **개발 전용**
- 특징:
  - DB 포함
  - `build:` 사용 허용
  - 메모리/동시성 제한 느슨함
  - `restart: unless-stopped` (워커 재시작 시 자동 복구)
  - 워커 제어 포트 `ports` 노출 (개발 편의)

### Develop (`docker-compose.develop.yml`)

- 목적: **develop 브랜치 검증**
- 특징:
  - 미리 빌드된 dev 이미지 사용
  - 운영과 유사하지만 제한은 완화

### Production (`docker-compose.production.yml`)

- 목적: **실서비스**
- 필수 규칙:
  - image + digest 고정
  - CA 번들 마운트 필수
  - 워커 제어 포트는 `expose`만 사용 (`ports` 금지)

---

## 🧯 트러블슈팅 체크리스트

### Prisma TLS 오류

`self-signed certificate in certificate chain`

확인 순서:

1. 컨테이너에 `ca-certificates` 설치 여부
2. RDS CA 번들 파일 마운트 여부
3. `DATABASE_URL`에 `sslrootcert` 포함 여부
4. `sslmode=verify-full` 유지 여부

> ❗ 보안 하향(`require`, `prefer`) 제안 금지

---

---

## 🧪 변경 시 검증 기준

리팩토링 또는 기능 수정 후 반드시 아래를 만족해야 한다.

- 체크 결과 로직 동일 (패턴 탐지 결과 변경 ❌)
- 중복 알림 발생 ❌

권장 검증 명령:

```bash
pnpm ci:check   # lint + format:check + test + build (CI와 동일)
# 또는 개별 실행:
pnpm lint
pnpm format:check
pnpm test
pnpm build
pnpm cron       # 로컬에서 워커 단독 실행 확인
```

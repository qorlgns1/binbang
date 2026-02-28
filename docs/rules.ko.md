# RULES.md (모노레포 - 강제 규칙)

## 0. 핵심 원칙

- 이 저장소는 엄격한 경계(strict boundaries)를 가진 모노레포이다.
- 경계는 관례가 아니라 패키지 소유권(package ownership)과 공개 API(public APIs)로 강제된다.
- 위반은 마이그레이션/유지보수 비용을 증가시키므로 금지한다.
- 본 문서의 키워드 의미:
  - MUST / MUST NOT: 협상 불가 규칙
  - MAY: 허용되지만 필수는 아님
  - SHOULD / SHOULD NOT: 강력 권고(명시적 사유 없이는 기본 준수)

---

## MONOREPO_PLAN과의 관계

이 문서는 `MONOREPO_PLAN.md`에서 정의한 구조/의사결정을 기반으로 한 강제 규칙을 정의한다.

- `MONOREPO_PLAN.md`는 의도된 아키텍처와 마이그레이션 계획을 설명한다.
- `rules.md`는 마이그레이션 전/후 모두 지켜야 하는 비협상 제약을 정의한다.

충돌 시:

- 구현/코드리뷰 기준은 `rules.md`가 우선한다.
- 아키텍처 의도가 바뀌면 `MONOREPO_PLAN.md`를 반드시 갱신한다.

---

## 1. 모노레포 구조 (권위 구조)

```text
apps/
  web/            # Next.js (UI + Server Components + Route Handlers)
  travel/         # Next.js 여행 앱 (AI planner); apps/web과 동일 레이어 규칙 (DB는 services/** 만)
  worker/         # 워커 엔트리포인트 + wiring만 담당 (로직 금지)

packages/
  db/             # Prisma 스키마, 마이그레이션, DB 클라이언트 (단일 소유자)
  shared/         # 범용 공유 코드 (순수, 런타임 비의존)
  worker-shared/  # 워커 전용 공유 코드 (runtime / jobs / browser / observability)
```

- 명시적 승인 없는 신규 최상위 디렉터리 추가는 금지.
- 코드 소유권은 편의가 아니라 패키지 단위로 정의된다.

---

## 2. 패키지 공개 API 규칙

### 2.1 Deep Import 금지

- `packages/**/src/**` 또는 내부 파일로의 deep import는 금지.
- 패키지 `exports`에 노출된 공개 진입점만 import해야 한다.

예시:

- 허용: `import { foo } from "@workspace/shared"`
- 금지: `import { foo } from "@workspace/shared/src/foo"`
- 허용: `import { runtimeX } from "@workspace/worker-shared/runtime"`
- 금지: `import { runtimeX } from "@workspace/worker-shared/src/runtime/x"`

---

## 3. Shared 코드 경계

### 3.1 `@workspace/shared` (universal)

목적:
웹/워커 어디서든 안전한 범용 코드를 둔다.

허용(ONLY):

- 타입, 인터페이스, DTO
- 부작용 없는 순수 유틸
- 상수/매핑
- 포맷/파싱 유틸
- 에러 타입/에러 코드
- `Date`, `Intl` 사용

금지(MUST NOT):

- 네트워크 I/O(`fetch`, `axios`, HTTP 클라이언트)
- DB 접근/Prisma 사용(`@workspace/db` 포함)
- Node 내장 모듈(`fs`, `path`, `child_process` 등)
- 런타임 제어용 타이머/스케줄링(cron/queue/retry)
- 브라우저 자동화 라이브러리(Playwright, Puppeteer)
- `process.env` 직접 접근(`dotenv` 포함)
- 워커 런타임 라이브러리(BullMQ, Redis 클라이언트 등)

`@workspace/shared`는 반드시 순수하고(runtime-agnostic) 런타임 독립적이어야 한다.

---

### 3.2 `@workspace/worker-shared` (worker-only)

목적:
워커 전용 공유 코드. Node 전용 코드를 허용한다.

허용:

- Node 전용 코드
- 브라우저 자동화(Playwright), cron/queue helper, job 유틸
- 아래 제약을 만족하는 범위의 `@workspace/db` 접근
- observability 유틸

금지:

- `apps/web/**`는 어떤 맥락에서도 `@workspace/worker-shared`를 import하면 안 된다.
- `apps/travel/**`도 어떤 맥락에서도 `@workspace/worker-shared`를 import하면 안 된다.
- `@workspace/worker-shared`는 Next.js/web UI 런타임(React/Next/shadcn)에 의존하면 안 된다.

---

## 4. Worker-Shared 구조와 경계

`@workspace/worker-shared`의 공개 서브패스는 아래 4개로 고정된다.

- `@workspace/worker-shared/browser`
- `@workspace/worker-shared/jobs`
- `@workspace/worker-shared/runtime`
- `@workspace/worker-shared/observability`

규칙:

- 공개 카테고리 추가/병합/이름 변경 금지
- 내부 폴더 구조는 변경 가능하나 공개 진입점 안정성은 유지
- 소비자는 위 4개 공개 서브패스만 사용

### 4.1 `browser/`

- 브라우저 자동화 실행 전용
- 스케줄링/재시도/큐/런타임 제어 금지
- 실행 환경 세부를 알면 안 됨

DB / Env:

- `browser/**`는 DB(`@workspace/db`) 직접/간접 접근 금지
- `browser/**`는 `process.env` 직접 접근 금지

### 4.2 `jobs/`

- "무슨 작업이 존재하는지"만 정의
- 브라우저 직접 제어 금지
- cron/queue 라이브러리 직접 사용 금지
- 실행은 반드시 `runtime`에 위임

DB / Env:

- `jobs/**`는 DB(`@workspace/db`) 직접/간접 접근 금지
- `jobs/**`는 환경변수 직접 접근 금지

### 4.3 `runtime/`

- 실행 전략/환경 제어의 단일 소유자
- cron, queue adapter, retry, backoff, concurrency, rate limit 책임 허용
- 비즈니스 로직/브라우저 도메인 로직 금지

DB 규칙(강제):

- `@workspace/db` 접근은 `runtime/**`에서만 허용
- worker-shared 내 DB 접근의 단일 소유자는 `runtime/**`
- `jobs/**`가 데이터가 필요하면 DB import 대신 runtime orchestration으로 요청

Env 규칙(강제):

- 환경변수 접근은 `runtime/settings/**`에서만 허용
- `runtime/**`(단, `runtime/settings/**` 제외)는 `process.env` 직접 접근 금지
- `runtime/settings/**` 책임:
  - env 로딩/정규화
  - validation
  - default/fallback 규칙

### 4.4 `observability/`

- 로깅/메트릭/트레이싱/에러 정규화 담당
- 제어 흐름 변경/의사결정 금지
- 암묵적 전역 부작용 금지

DB / Env:

- `observability/**`는 DB(`@workspace/db`) 직접/간접 접근 금지
- `observability/**`는 환경변수 직접 접근 금지

### 4.5 Worker-Shared 의존 규칙

허용:

- `jobs` -> `runtime`
- `jobs` -> `observability`
- `browser` -> `observability`
- `runtime` -> `observability`

금지:

- `browser` -> `jobs`
- `browser` -> `runtime`
- `jobs` -> `browser`
- `observability` -> 도메인 로직

---

## 5. Prisma / 데이터베이스 규칙 (`@workspace/db`)

### 5.1 소유권

- Prisma schema/migration은 `packages/db/prisma/**`에만 존재해야 한다.
- Prisma Client 생성/노출은 `packages/db`가 단독 소유한다.

### 5.2 Import 정책

- 허용: `import { prisma } from "@workspace/db"`
- 금지:
  - `packages/db` 외부에서 `@prisma/client` import
  - `packages/db/**` deep import
  - 타 패키지/앱에서 Prisma Client 재수출

접근 규칙:

- `apps/web` Client Component는 DB 직접/간접 접근 금지
- `apps/web` Server 측 코드는 `apps/web/src/services/**`를 통해서만 DB 접근 가능
- `apps/travel`도 동일: DB 접근은 `apps/travel/src/services/**`로만 허용, Route Handler의 `prisma.*` 직접 호출 금지
- `apps/worker`는 `@workspace/db` 접근 가능하지만 가능하면 `@workspace/worker-shared/runtime` 경유를 권장
- `packages/shared`는 DB 의존 금지
- `packages/worker-shared`는 `runtime/**`에서만 DB 의존 허용

### 5.3 쿼리 원칙

- Route Handler는 `prisma.*` 직접 호출 금지. DB 작업은 `apps/web/src/services/**` 또는 `apps/travel/src/services/**`에 위임.
- 모든 쿼리는 `select`를 사용해야 한다(암묵적 전체 선택 금지).
- 루프 안 쿼리 금지.
- 다단계 논리 작업은 트랜잭션 사용.

### 5.4 마이그레이션 원칙

- `prisma db push` 금지.
- 스키마 변경은 `prisma migrate dev` 사용.
- 배포된 migration 수정/삭제 금지.
- 수동 migration SQL은 기본 금지.
- schema/migration 변경은 명시적 승인 필요.

---

## 6. 웹 레이어링 규칙 (App Router: RSC / Actions / Route Handlers)

본 장은 `apps/web`와 `apps/travel` 모두에 적용된다. `apps/travel`에서는 아래 경로의 `apps/web`를 `apps/travel`로 치환해 동일하게 적용한다.

### 6.1 정의(강제)

- Route Handler: `apps/web/src/app/api/**/route.ts` (또는 `apps/travel/src/app/api/**/route.ts`)
- Server Component: `app/` 기본(단, `'use client'` 제외)
- Server Action: `"use server"` 의미를 가지는 함수

세 레이어는 책임이 분리된 독립 계층으로 취급해야 한다.

### 6.2 `apps/web` DB 접근 규칙(강제)

Single Gate Rule:

- `apps/web`의 DB 접근 허용 경로는 `apps/web/src/services/**`로 한정
- `apps/travel`의 DB 접근 허용 경로는 `apps/travel/src/services/**`로 한정

Route Handlers:

- `apps/web/src/app/api/**` Route Handler는 DB 직접 접근 금지
  - 금지 예: `@workspace/db` import, Prisma 호출, SQL 실행
- Route Handler의 DB 접근은 `apps/web/src/services/**` 경유만 허용
- Route Handler는 `apps/web/src/services/**` 외 DB-touching 모듈 호출 금지
- Route Handler 책임은 아래로 한정:
  - authn/authz
  - 파싱 + Zod validation
  - request/response 정규화
  - `services/**` 호출
  - 에러 매핑/상태코드 반환

Server Components / Server Actions:

- DB 직접 접근 금지
- DB-backed 데이터는 `services/**` 호출로만 획득

Client Components:

- DB 직접/간접 접근 금지
- 승인된 fetch 패턴(API 호출, React Query 등) 사용
- server-only 모듈 import 금지

---

## 7. 루트 `package.json` 의존성 규칙

- 루트 `package.json`은 tooling 전용 의존성만 둔다.
- 루트 `dependencies`는 항상 비어 있어야 한다.
- 루트에 런타임 라이브러리 추가 금지.

소유권:

- Web 런타임 의존성: `apps/web`
- Worker 런타임 의존성: `apps/worker`, `packages/worker-shared`
- DB 의존성: `packages/db`
- 범용 shared 의존성: `packages/shared` (shared 경계 준수)

예외는 명시적 근거와 승인 필요.

---

## 8. Worker App 강제 규칙 (`apps/worker`)

- `apps/worker/**`는 엔트리포인트 + 조립(wiring)만 담당
- 재사용 워커 로직은 반드시 `@workspace/worker-shared`로 승격
- 도메인 로직, 브라우저 자동화 로직, 런타임 로직, DB 로직은 `apps/worker`에 두면 안 된다

경계는 "개발자 자율"이 아니라 import 규칙으로 강제한다.

---

## 9. Generated 산출물 규칙(강제)

### 9.1 커밋 정책

- `generated` 출력 디렉터리는 build artifact이며 커밋 금지
- 최소 아래 경로는 산출물로 취급:
  - `**/generated/**`
  - `**/src/generated/**`
  - `**/dist/**`

### 9.2 사용 정책

- generated 산출물을 shared interface/DTO의 source of truth로 사용 금지
- 공유 타입 원천은 `packages/shared/src/types/**`
- LLM은 generated 디렉터리를 비권위 산출물로 취급:
  - 수정 금지
  - 리팩터 금지
  - package exports에 명시 허용이 없으면 안정 import 소스로 사용 금지

---

## 10. 작업 후 검증 규칙 (LLM)

- LLM이 코드 변경 작업을 마치고 완료 보고하기 직전에 루트에서 `pnpm ci:check`를 반드시 실행한다.
- "작업 완료"란 코드 변경을 끝내고 결과 보고를 하려는 시점을 의미한다.
- `pnpm ci:check` 실패 시 완료 보고는 금지.
- lint/test/build/typecheck를 부분 실행해 우회하면 안 된다.

---

## 11. 커밋/푸시 전 검증 규칙 (Human + LLM)

- 모든 commit/push 전에 루트 `pnpm ci:check` 실행은 필수.
- 미실행 또는 실패 상태의 commit/push는 정책 위반.
- 본 규칙은 사람/LLM/자동화 스크립트 모두 동일하게 적용.

---

## 12. 네이밍 규칙(강제)

### 12.0 적용 범위

- 신규 생성 파일/폴더와 명시적 rename 작업에 적용
- 기존 legacy 이름은 scoped refactor ticket로 점진 이관 가능
- 범위 정의 없는 저장소 전역 bulk rename 금지

### 12.1 파일 네이밍

- React component 파일(`.tsx`)은 `PascalCase`
  - 예: `AdminSidebar.tsx`, `DateFilter.tsx`
- 비컴포넌트 소스 파일(`.ts` / utility `.tsx`)은 `camelCase`
  - 예: `useFunnelQuery.ts`, `landingEventRetention.ts`, `dateFilter.test.ts`

### 12.2 폴더 네이밍

- 폴더는 `kebab-case`
  - 예: `admin-funnel`, `landing-events`

### 12.3 Next App Router private 폴더

- `apps/web/src/app/**`에서 route segment가 아닌 구현 상세 폴더는 `_` prefix 필수
  - 예: `_components`, `_hooks`, `_lib`
- `_` 뒤 naming(`camelCase` 또는 `kebab-case`)은 동일 route subtree 내 일관 유지

### 12.4 필수 예외

- Next.js 예약 파일명은 그대로 유지:
  - `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `template.tsx`, `default.tsx`
- 테스트/스냅샷 관례 폴더 허용:
  - `__tests__`, `__snapshots__`
- locale 폴더는 BCP-47 스타일 허용:
  - 예: `ko`, `en`, `ja`, `zh-CN`
- `packages/db/prisma/migrations/**` 디렉터리는 immutable 자산으로 폴더 네이밍 규칙 예외
- 외부 툴/계약 파일명은 통합 요구 시 upstream naming 유지 가능:
  - 예: `next-auth.d.ts`
- `apps/web/src/components/ui/**`는 shadcn 호환을 위해 kebab-case 컴포넌트 파일명을 허용
- `apps/web/src/services/**`, `apps/travel/src/services/**` 서비스 레이어 파일은 kebab-case + `.service` suffix 필수
  - 예: `accommodations.service.ts`, `admin/funnel-clicks.service.ts`, `affiliate-funnel.service.ts`
- `apps/web/src/services/**`, `apps/travel/src/services/**` 서비스 테스트 파일은 kebab-case + `.service.test` suffix 필수
  - 예: `accommodations.service.test.ts`, `admin/__tests__/funnel-clicks.service.test.ts`

---

## 13. `lib/` 내부 모듈 접근 규칙 (`apps/web`, `apps/travel`)

`lib/` 하위 모듈은 구현 디테일이며 임의 공개 import 대상으로 쓰면 안 된다.

### 13.1 Index 기반 모듈

`lib/` 하위 디렉터리에 `index.ts`가 있으면 해당 파일만 공개 진입점이다.

- 소비자는 `@/lib/foo`(= `index.ts`)로 import해야 하며 `@/lib/foo/bar` import 금지
- 허용: `import { createTravelTools } from '@/lib/ai/tools'`
- 금지: `import { createSearchAccommodationTool } from '@/lib/ai/tools/searchAccommodation'`

### 13.2 Service-facade 모듈

`index.ts` 없이 내부 helper 파일들로 분리된 `lib/` 모듈은 지정된 `services/**` facade를 통해서만 접근해야 한다.

- Route Handler, Server Component, Client Component, 기타 `lib/` 파일은 내부 sub-module 직접 import 금지
- 지정된 `services/**` facade만 내부 파일 import 허용
- 허용: `services/cache.service.ts`가 `@/lib/cache/cacheEnvelope` import
- 금지: Route Handler가 `@/lib/cache/cacheEnvelope`를 직접 import

---

## 최종 노트

워커 구현/런타임/인프라는 시간이 지나며 계속 바뀔 수 있다.
그 변화와 무관하게 job 정의와 도메인 로직은 안정적으로 유지되어야 한다.

이 규칙의 목적은 경계를 강제 가능하게 유지하고,
작은 인스턴스에서도 런타임을 안정화하며,
변경을 리뷰 가능하고 정확한 단위로 유지하는 데 있다.

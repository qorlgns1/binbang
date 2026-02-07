# MONOREPO_PLAN.md

## 1. Purpose

This document describes the **intended monorepo architecture** and the **migration strategy** for this repository.

The goals of this migration are:

- Reduce long-term maintenance cost by enforcing clear ownership boundaries
- Separate web, worker, shared, and database concerns explicitly
- Enable future changes to worker runtime and execution model with minimal impact
- Prevent accidental coupling between client, server, worker, and infrastructure code

This document explains **what we are building and why**.  
All **enforced constraints and non-negotiable rules** are defined in `rules.md`.

---

## 2. Relationship to rules.md

- `MONOREPO_PLAN.md` describes architectural intent and migration steps.
- `rules.md` defines strict boundaries, import rules, and ownership policies.

In case of conflict:

- `rules.md` takes precedence for implementation and code review.
- This plan must be updated if architectural intent changes.

No migration step described here may violate `rules.md`.

---

## 3. Target Architecture

### 3.1 High-level Structure

`apps/
  web/ # Next.js application (UI + Route Handlers) worker/ # Background workers (cron, automation, jobs) packages/
  shared/ # Shared code with explicit boundaries db/ # Prisma schema, migrations, database client`

Ownership is defined at the **package level**.  
Code is organized by responsibility, not convenience.

---

### 3.2 Application Responsibilities

#### apps/web

- User-facing application
- Next.js App Router
- Server Components and Route Handlers act as the boundary to backend services
- No direct dependency on worker-only or infrastructure-specific logic

#### apps/worker

- Background execution environment
- Cron jobs, automation, and asynchronous processing
- Designed to evolve independently from web runtime concerns

---

### 3.3 Shared Packages

#### packages/shared

Shared code is divided by **public API**, not by folder proximity.

- `@shared`  
  Universal, runtime-agnostic code usable by both web and worker
- `@shared/worker`  
  Worker-only shared code, explicitly excluded from web usage

This separation exists to prevent accidental coupling and to support future worker changes.

---

### 3.4 Database Package

#### packages/db

- Single owner of database schema and migrations
- Single public database access point exposed as `@repo/db`
- Prevents database logic from leaking into unrelated packages

---

## 4. Worker Domain Model

Worker-related shared code is structured around four stable domains:

`browser/ jobs/
runtime/
observability/`

These domains represent responsibilities, not implementation details.

- `browser`  
  Browser automation and execution logic
- `jobs`  
  Definitions of work units and handlers
- `runtime`  
  Execution strategy, scheduling, queues, retries, and concurrency
- `observability`  
  Logging, metrics, tracing, and error normalization

This model allows the worker runtime and execution strategy to change without rewriting job definitions or domain logic.

---

## 5. Public API Concepts

This repository enforces boundaries through **explicit public APIs**.

Key concepts:

- Packages expose limited, intentional entry points
- Internal file structure is not part of the API
- Consumers depend on capabilities, not implementations

Examples:

- Web and worker consume shared functionality via `@shared`
- Worker-specific logic is consumed via `@shared/worker`
- All database access goes through `@repo/db`

---

## 6. Migration Strategy

Migration is incremental and designed to minimize risk.

### Step 1: Establish Structure

- Introduce `apps/` and `packages/` layout
- Ensure tooling and build pipelines recognize the new structure

### Step 2: Database Ownership

- Move Prisma schema and migrations into `packages/db`
- Introduce `@repo/db` as the single database entry point

### Step 3: Shared Code Separation

- Identify shared code currently mixed with app logic
- Promote universal logic to `@shared`
- Promote worker-only shared logic to `@shared/worker`

### Step 4: Worker Refactoring

- Separate worker entry points from reusable worker logic
- Organize worker shared code into browser, jobs, runtime, and observability domains

Each step must comply with `rules.md`.

---

## 7. Non-goals

This plan intentionally does not decide:

- Which queue system or message broker to use
- Which worker runtime or hosting model to adopt
- Performance optimizations unrelated to boundary correctness
- UI or product-level feature changes

These decisions may be addressed in separate proposals.

---

## 8. Success Criteria

The migration is considered successful when:

- Boundaries are enforced through imports and package APIs
- Web, worker, shared, and database code can evolve independently
- Worker runtime changes do not require rewriting job definitions
- Accidental cross-domain dependencies are prevented by structure

---

## 9. Final Note

This plan defines **direction and sequence**, not enforcement.

All enforcement lives in `rules.md`.  
This separation ensures that architectural intent remains clear while constraints remain strict.

## 1. 목표 구조 (Tree)

binbang/
├── apps/
│ ├── web/
│ │ ├── src/
│ │ │ ├── app/
│ │ │ ├── components/
│ │ │ ├── features/
│ │ │ ├── services/
│ │ │ └── lib/
│ │ │ ├── auth.ts
│ │ │ ├── admin.ts
│ │ │ ├── rbac.ts
│ │ │ ├── queryKeys.ts
│ │ │ ├── priceFormat.ts
│ │ │ ├── rateLimit.ts
│ │ │ ├── auditLog.ts
│ │ │ ├── url-parser.ts
│ │ │ └── utils.ts
│ │ ├── public/
│ │ ├── next.config.ts
│ │ └── package.json
│ │
│ └── worker/
│ ├── src/
│ │ ├── main.ts # entry / composition only
│ │ └── config.ts # worker bootstrap config
│ ├── Dockerfile
│ └── package.json
│
├── packages/
│ ├── db/
│ │ ├── prisma/
│ │ │ ├── schema.prisma
│ │ │ └── migrations/
│ │ ├── src/
│ │ │ ├── client.ts
│ │ │ └── index.ts
│ │ └── package.json
│ │
│ └── shared/
│ ├── src/
│ │ ├── index.ts # @shared (universal)
│ │ ├── types/
│ │ │ ├── checker.ts
│ │ │ ├── accommodation.ts
│ │ │ └── index.ts
│ │ └── utils/
│ │ ├── priceParser.ts
│ │ ├── priceFormat.ts
│ │ └── index.ts
│ │
│ │ ├── worker/ # @shared/worker
│ │ │ ├── index.ts
│ │ │ ├── browser/
│ │ │ │ ├── browserPool.ts
│ │ │ │ ├── baseChecker.ts
│ │ │ │ ├── airbnb.ts
│ │ │ │ └── agoda.ts
│ │ │ ├── jobs/
│ │ │ │ ├── check.job.ts
│ │ │ │ └── index.ts
│ │ │ ├── runtime/
│ │ │ │ ├── queue.ts
│ │ │ │ ├── scheduler.ts
│ │ │ │ └── retry.ts
│ │ │ └── observability/
│ │ │ ├── logger.ts
│ │ │ ├── metrics.ts
│ │ │ └── index.ts
│ ├── tsconfig.json
│ └── package.json
│
├── docker/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.base.json

## 2. 패키지별 역할 및 파일 목록 (업데이트 버전)

### 2.1 `apps/web` – Next.js Web Application

`apps/web`는 사용자-facing 웹 애플리케이션이며, UI 및 웹 서버 경계를 담당한다.

| 카테고리      | 파일/디렉토리                | 설명                                                                                |
| ------------- | ---------------------------- | ----------------------------------------------------------------------------------- |
| App Router    | `apps/web/src/app/**`        | Next.js App Router 페이지 및 레이아웃                                               |
| Components    | `apps/web/src/components/**` | 재사용 가능한 React 컴포넌트                                                        |
| Features      | `apps/web/src/features/**`   | TanStack Query 기반 데이터 접근 훅                                                  |
| Services      | `apps/web/src/services/**`   | API / 서버 통신을 담당하는 service layer                                            |
| Web-only Libs | `apps/web/src/lib/**`        | 웹 전용 유틸리티 (auth, admin, rbac, queryKeys, rateLimit, auditLog, url-parser 등) |
| Tests         | `apps/web/src/**/*.test.ts`  | 웹 애플리케이션 테스트 코드                                                         |

**경계 규칙**

- `apps/web`는 `@shared`만 import 가능하다.
- `@shared/worker` import는 client/server 모두 금지된다.
- Client Components는 `@repo/db`에 직접 또는 간접적으로 접근할 수 없다.

---

### 2.2 `apps/worker` – Worker Application (Entry & Composition)

`apps/worker`는 워커 프로세스의 진입점과 조립(composition)만 담당한다.  
재사용 가능한 로직은 포함하지 않는다.

| 카테고리         | 파일/디렉토리               | 설명                             |
| ---------------- | --------------------------- | -------------------------------- |
| Entry            | `apps/worker/src/main.ts`   | 워커 실행 진입점                 |
| Bootstrap Config | `apps/worker/src/config.ts` | 워커 환경 초기화 및 설정         |
| Composition      | `apps/worker/src/**`        | 큐/잡/스케줄러 조립 및 등록 코드 |

**강제 규칙**

- `apps/worker`는 실행 흐름을 “조립”만 한다.
- 브라우저 자동화, 잡 정의, 런타임 제어, 관측 로직은 포함하지 않는다.
- 모든 재사용 가능한 워커 로직은 `@shared/worker`로 이동한다.

---

### 2.3 `packages/db` – Database Package (`@repo/db`)

`packages/db`는 데이터베이스 관련 코드의 단일 소유자다.

| 카테고리     | 파일/디렉토리                      | 설명                        |
| ------------ | ---------------------------------- | --------------------------- |
| Schema       | `packages/db/prisma/schema.prisma` | 전체 Prisma 스키마          |
| Migrations   | `packages/db/prisma/migrations/**` | Prisma 마이그레이션 파일    |
| Client       | `packages/db/src/client.ts`        | Prisma Client 생성          |
| Public Entry | `packages/db/src/index.ts`         | `@repo/db` 단일 공개 진입점 |

**경계 규칙**

- `@prisma/client` 직접 import는 `packages/db` 외부에서 금지된다.
- DB 접근은 반드시 `@repo/db`를 통해서만 이루어져야 한다.
- `packages/shared`는 DB에 의존할 수 없다.

---

### 2.4 `packages/shared` – Shared Modules

`packages/shared`는 공개 API 기준으로 분리된 공용 코드를 제공한다.

---

#### 2.4.1 `@shared` (Universal)

`@shared`는 웹과 워커에서 공통으로 사용할 수 있는 런타임 중립 코드만 포함한다.

| 카테고리        | 파일/디렉토리                  | 설명                    |
| --------------- | ------------------------------ | ----------------------- |
| Types           | `packages/shared/src/types/**` | 공통 타입 및 인터페이스 |
| Universal Utils | `packages/shared/src/utils/**` | 순수 유틸리티 함수      |
| Public Entry    | `packages/shared/src/index.ts` | `@shared` 공개 진입점   |

**강제 규칙**

- 네트워크 호출(`fetch`, HTTP client) 금지
- Node built-in API 사용 금지
- Puppeteer / Playwright 등 브라우저 자동화 금지
- `process.env` 직접 접근 금지
- `Date` / `Intl` 사용은 허용

---

#### 2.4.2 `@shared/worker` (Worker-only)

`@shared/worker`는 워커 전용 공용 로직을 제공하며, 웹에서는 사용할 수 없다.

| 카테고리      | 파일/디렉토리                                 | 설명                              |
| ------------- | --------------------------------------------- | --------------------------------- |
| Public Entry  | `packages/shared/src/worker/index.ts`         | `@shared/worker` 공개 진입점      |
| browser       | `packages/shared/src/worker/browser/**`       | 브라우저 자동화 및 체커 로직      |
| jobs          | `packages/shared/src/worker/jobs/**`          | 작업 정의 및 핸들러               |
| runtime       | `packages/shared/src/worker/runtime/**`       | 큐, 스케줄링, 재시도, 동시성 제어 |
| observability | `packages/shared/src/worker/observability/**` | 로깅, 메트릭, 상태/헬스 체크      |

**강제 규칙**

- `apps/web`는 `@shared/worker`를 import할 수 없다.
- 워커 도메인 코드는 반드시 아래 4개 카테고리 중 하나에 속해야 한다.
  - `browser`
  - `jobs`
  - `runtime`
  - `observability`

## 3. Migration 단계 (Migration Strategy)

마이그레이션은 점진적으로 진행되며, 각 단계는 반드시 `rules.md`를 준수해야 한다.  
아래 단계는 **최종 목표 구조에 도달하기 위한 권장 순서**를 나타낸다.

---

### 1단계. Root 환경 구성

- 모노레포를 위한 기본 설정 파일을 준비한다.
  - `pnpm-workspace.yaml`
  - `turbo.json`
  - `tsconfig.base.json`
  - root `package.json`
- Root `package.json`에는 **툴링 전용 의존성만** 유지한다.
- 기존 단일 레포 구조의 설정은 이 단계에서 정리한다.

목표:

- 빌드/타입체크/린트가 모노레포 기준으로 동작할 수 있는 기반 확보

---

### 2단계. `packages/db` 구성 (Database Ownership)

- Prisma schema와 migrations를 `packages/db`로 이동한다.
- 단일 스키마(`schema.prisma`)를 기준으로 DB 구조를 통합한다.
- Prisma Client는 `packages/db`에서만 생성하고, `@repo/db`로만 노출한다.
- Turbo 파이프라인에서 generate 순서를 보장한다.

목표:

- 데이터베이스 소유권을 명확히 하고, DB 접근 경계를 고정

---

### 3단계. `packages/shared` 구성 (Shared Boundaries)

- 기존 공용 코드를 `packages/shared`로 이동한다.
- 공용 코드는 공개 API 기준으로 분리한다.
  - `@shared` (universal)
  - `@shared/worker` (worker-only)
- 테스트 파일은 함께 이동한다.
- import 경로를 새 공개 API 기준으로 수정한다.

목표:

- 웹/워커 간 의도치 않은 결합 제거
- 공용 코드의 책임 명확화

---

### 4단계. `apps/web` 구성 (Web Application)

- 기존 `src/` 구조를 `apps/web/src/`로 이동한다.
- Next.js 설정에서 workspace 패키지를 정상적으로 인식하도록 조정한다.
- Web 애플리케이션은 `@shared`만 사용하도록 정리한다.
- DB 접근은 server/route handler 경계에서만 허용한다.

목표:

- 웹 애플리케이션을 독립적인 workspace로 분리

---

### 5단계. `apps/worker` 구성 (Worker Entry)

- 워커 관련 파일을 `apps/worker`로 이동한다.
- `apps/worker`는 **엔트리 및 조립(composition)**만 담당하도록 단순화한다.
- 재사용 가능한 워커 로직은 `@shared/worker`로 이동한다.
- 워커 실행 모델(cron, queue 등)은 이 단계에서 통합한다.

목표:

- 워커 런타임 변경에 대비한 구조 확립

---

### 6단계. Infrastructure 연동

- 워커 실행에 필요한 외부 인프라를 구성한다.
  - 예: Redis (queue / scheduling backend)
- Docker Compose 또는 운영 환경 설정에 필요한 서비스를 추가한다.
- 워커 런타임 설정은 코드와 분리하여 관리한다.

목표:

- 로컬/운영 환경에서 동일한 실행 모델 확보

---

### 7단계. 테스트 및 배포 검증

- Turbo 기반으로 테스트, 린트, 타입체크를 실행한다.
- Web과 Worker를 각각 독립적으로 빌드/실행 검증한다.
- CI 파이프라인을 모노레포 기준으로 업데이트한다.

목표:

- 구조 변경이 기능 회귀 없이 완료되었는지 확인

---

### 8단계. 원본 구조 아카이브

- 기존 단일 레포 구조는 백업 또는 별도 브랜치로 보관한다.
- 새로운 구조가 안정화된 이후 정리한다.

목표:

- 롤백 가능성 확보 및 이력 보존

---

## 4. Prisma 공유 전략

- 단일 `schema.prisma`를 기준으로 전체 스키마를 관리한다.
- 워커/웹에서 필요한 데이터는 명시적인 `select`를 통해 제한한다.
- Prisma Client generate는 Turbo 파이프라인에서 순서를 보장한다.
- 데이터베이스 접근 규칙은 `rules.md`에 정의된 정책을 따른다.

---

## 5. 의존성(Dependencies) 관리 전략

- 각 런타임의 의존성은 소유 workspace에서 관리한다.
  - Web: Next.js / React 관련 의존성
  - Worker: Queue, Browser automation, Runtime 관련 의존성
  - DB: Prisma 및 DB 드라이버
- Root에는 런타임 의존성을 추가하지 않는다.
- 패키지 간 의존성 충돌이 발생할 경우, pnpm 설정으로 명시적으로 해결한다.

목표:

- 의존성 책임을 명확히 하고, 런타임 간 충돌 방지

## 7. 잠재 이슈 및 대응 전략

이 섹션은 모노레포 전환 과정에서 **자주 발생하는 구조적 이슈와 권장 대응 방향**을 정리한다.  
구체적인 설정 값이나 구현은 예시일 뿐이며, 최종 강제 규칙은 `rules.md`를 따른다.

---

### 7.1 TypeScript Path Alias 충돌

**문제**

- 기존 `@/` alias가 앱별로 다르게 해석될 수 있음
- workspace 간 import 경계가 모호해질 위험

**대응 전략**

- 공통 alias는 root `tsconfig.base.json`에서 정의
- 앱 로컬 alias(`@/*`)는 각 workspace 내부로 제한
- 패키지 간 접근은 공개 API alias만 사용 (`@repo/db`, `@shared`, `@shared/worker`)

---

### 7.2 Prisma Client 생성 순서

**문제**

- Prisma Client가 생성되기 전에 다른 패키지 빌드가 실행될 수 있음

**대응 전략**

- Prisma Client 생성은 `packages/db`의 책임으로 고정
- Turbo 파이프라인에서 DB generate 작업의 선행을 보장
- 구체적인 태스크 정의는 `turbo.json`에 위치

---

### 7.3 Worker 전용 의존성 전파 문제

**문제**

- Worker 전용 의존성(Playwright 등)이 web 번들에 포함될 수 있음

**대응 전략**

- Worker 전용 코드는 `@shared/worker`로 격리
- Web은 `@shared`만 의존하도록 구조적으로 차단
- 필요 시 pnpm hoist 설정으로 의존성 범위를 제한

---

### 7.4 환경 변수 관리 분리

**문제**

- Web / Worker / DB가 서로 다른 환경 변수를 요구

**대응 전략**

- 공통 환경 변수는 root 수준에서 관리
- 앱별 환경 변수는 각 workspace 단위로 분리
- 런타임별 env 검증 로직은 각 소유 패키지에서 수행

---

### 7.5 Turborepo 캐시 무효화

**문제**

- DB 스키마 변경 시 관련 빌드 캐시가 무효화되지 않을 수 있음

**대응 전략**

- Prisma schema 파일을 Turbo의 글로벌 의존성으로 등록
- 스키마 변경 시 관련 태스크가 재실행되도록 구성

---

### 7.6 타입 이름 충돌

**문제**

- Prisma 타입과 도메인 타입 간 이름 충돌 가능성

**대응 전략**

- Prisma 타입은 `@repo/db`에서만 export
- 도메인 타입은 `@shared`에서만 export
- 명확한 네이밍 규칙 유지 (예: `PrismaUser`, `UserDTO`)

---

## 8. 파일 구성 요약

### Root Level

| 파일                  | 목적                      |
| --------------------- | ------------------------- |
| `pnpm-workspace.yaml` | Workspace 정의            |
| `turbo.json`          | 빌드 및 태스크 파이프라인 |
| `tsconfig.base.json`  | 공통 TypeScript 설정      |
| `package.json`        | Root tooling 의존성       |

---

### Workspace Packages

| 패키지           | 책임                                   |
| ---------------- | -------------------------------------- |
| `@repo/db`       | Prisma 스키마, 마이그레이션, DB Client |
| `@shared`        | 런타임 중립 공용 코드                  |
| `@shared/worker` | 워커 전용 공용 코드                    |
| `apps/web`       | Next.js Web Application                |
| `apps/worker`    | Worker 엔트리 및 조립                  |

---

## 9. Configuration Management 원칙

- 앱/패키지별 설정 파일은 해당 workspace에 위치한다.
- 공통 설정은 root 또는 base config로 끌어올린다.
- 예시 설정 파일은 문서가 아닌 실제 코드로 관리한다.
- 문서에는 “어디에 무엇이 있어야 하는지”만 남긴다.

---

## 10. Migration Checklist (개념적)

- [ ] 모노레포 기본 구조 확립
- [ ] Database ownership 분리
- [ ] Shared / Worker boundary 확정
- [ ] Web workspace 독립 빌드 확인
- [ ] Worker 엔트리 단순화
- [ ] CI 파이프라인 모노레포 대응
- [ ] 기존 구조 아카이브

각 항목의 세부 구현과 검증 기준은 `rules.md`를 따른다.

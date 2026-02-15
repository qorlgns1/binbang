# RULES.md (Monorepo – Enforced)

## 0. Core Principles

- This repository is a monorepo with strict boundaries.
- Boundaries are enforced by **package ownership** and **public APIs**, not by convention.
- Any violation increases future migration and maintenance cost and is forbidden.
- Rules use the following keywords:
  - **MUST / MUST NOT**: non-negotiable.
  - **MAY**: allowed but not required.
  - **SHOULD / SHOULD NOT**: strong guidance; treat as default unless explicitly justified.

---

## Relationship to MONOREPO_PLAN

This document defines **enforced rules** based on the repository structure and decisions described in `MONOREPO_PLAN.md`.

- `MONOREPO_PLAN.md` describes the **intended architecture and migration plan**.
- `rules.md` defines **non-negotiable constraints** that must be followed during and after migration.

In case of conflict:

- `rules.md` takes precedence for implementation and code review.
- `MONOREPO_PLAN.md` MUST be updated if architectural intent changes.

---

## 1. Monorepo Structure (Authoritative)
```
apps/
  web/            # Next.js (UI + Server Components + Route Handlers)
  worker/         # 워커 엔트리포인트 + wiring만 담당 (로직 금지)

packages/
  db/             # Prisma 스키마, 마이그레이션, DB 클라이언트 (단일 소유자)
  shared/         # 범용 공유 코드 (순수, 런타임 비의존)
  worker-shared/  # 워커 전용 공유 코드 (runtime / jobs / browser / observability)
```


- New top-level directories are forbidden unless explicitly approved.
- Code ownership is defined by **package**, not by convenience.

---

## 2. Package Public API Rules

### 2.1 Deep Imports

- Deep imports into `packages/**/src/**` or internal files are forbidden.
- Only public entry points defined by package `exports` may be imported.

**Examples**
- ✅ Allowed: `import { foo } from "@workspace/shared"`
- ❌ Forbidden: `import { foo } from "@workspace/shared/src/foo"`
- ✅ Allowed: `import { runtimeX } from "@workspace/worker-shared/runtime"`
- ❌ Forbidden: `import { runtimeX } from "@workspace/worker-shared/src/runtime/x"`

---

## 3. Shared Code Boundaries

### 3.1 `@workspace/shared` (universal)

**Purpose**  
Universal code that is safe for both web and worker environments.

**Allowed (ONLY)**

- Types, interfaces, DTOs
- Pure utilities with no side effects
- Constants, mappings
- Formatting and parsing utilities
- Error types and error codes
- Usage of `Date` and `Intl`

**Forbidden (MUST NOT)**

- Network I/O such as `fetch`, `axios`, or HTTP clients
- Database access or Prisma usage (including `@workspace/db`)
- Node built-in modules (`fs`, `path`, `child_process`, etc.)
- Timers and scheduling primitives used for runtime control (cron/queues/retries)
- Browser automation libraries (Puppeteer, Playwright)
- Direct access to `process.env` (including `dotenv` usage)
- Any worker runtime libraries (BullMQ, Redis clients, etc.)

`@workspace/shared` MUST remain **pure** and **runtime-agnostic**.

---

### 3.2 `@workspace/worker-shared` (worker-only)

**Purpose**  
Worker-only shared code. Node-only code is allowed.

**Allowed**

- Node-only code
- Browser automation (Playwright), cron/queue helpers, job-related utilities
- DB access via `@workspace/db` **only under the constraints below**
- Observability utilities

**Forbidden**

- `apps/web/**` MUST NOT import `@workspace/worker-shared` in any context (client or server).
- Any UI/runtime for Next.js/web (React/Next/shadcn) MUST NOT be depended on by `@workspace/worker-shared`.

---

## 4. Worker-Shared Structure and Boundaries

`@workspace/worker-shared` exposes exactly four categories as **public entrypoints**:

- `@workspace/worker-shared/browser`
- `@workspace/worker-shared/jobs`
- `@workspace/worker-shared/runtime`
- `@workspace/worker-shared/observability`

**Rules**
- Renaming, merging, or adding public categories is forbidden.
- Internal folder structures may evolve, but public entrypoints MUST remain stable.
- Only the above subpath exports are allowed for consumers.

---

### 4.1 `browser/`

- Responsible only for browser automation **execution**.
- Scheduling, retries, queues, and runtime control are forbidden.
- The execution environment (cron, queues, runtime details) MUST NOT be known.

Browser code must be execution-only.

**DB / Env**
- `browser/**` MUST NOT access DB (`@workspace/db`) directly or indirectly.
- `browser/**` MUST NOT access environment variables (`process.env`) directly.

---

### 4.2 `jobs/`

- Defines what work exists.
- Direct browser control is forbidden.
- Direct usage of cron or queue libraries is forbidden.
- Execution MUST always be delegated to `runtime`.

Jobs define work; they do not execute it.

**DB / Env**
- `jobs/**` MUST NOT access DB (`@workspace/db`) directly or indirectly.
- `jobs/**` MUST NOT access environment variables directly.

---

### 4.3 `runtime/`

- Owns execution strategy and environment concerns.
- Allowed responsibilities include cron handling, queue adapters, retries, backoff, concurrency, and rate limiting.
- Business logic and browser-domain logic are forbidden.

Changing the runtime MUST NOT require changes to job definitions.

**DB Rule (Enforced)**
- DB access via `@workspace/db` is allowed **ONLY** inside `runtime/**`.
- `runtime/**` is the single owner of DB access in worker-shared.
- If `jobs/**` needs data, it MUST request it via runtime orchestration (not by importing DB).

**Env Rule (Enforced)**
- Environment variable access is allowed **ONLY** inside `runtime/settings/**`.
- `runtime/**` (outside `runtime/settings/**`) MUST NOT read `process.env` directly.
- `runtime/settings/**` MUST be responsible for:
  - env loading/normalization
  - validation
  - defaulting/fallback rules

---

### 4.4 `observability/`

- Responsible for logging, metrics, tracing, and error normalization.
- Control flow changes and decision making are forbidden.
- Implicit global side effects are forbidden.

Observability records behavior but does not control it.

**DB / Env**
- `observability/**` MUST NOT access DB (`@workspace/db`) directly or indirectly.
- `observability/**` MUST NOT access environment variables directly.

---

### 4.5 Worker-Shared Dependency Rules

**Allowed**

- `jobs` MAY depend on `runtime`
- `jobs` MAY depend on `observability`
- `browser` MAY depend on `observability`
- `runtime` MAY depend on `observability`

**Forbidden**

- `browser` depending on `jobs`
- `browser` depending on `runtime`
- `jobs` depending on `browser`
- `observability` depending on any domain logic

---

## 5. Prisma / Database Rules (`@workspace/db`)

### 5.1 Ownership

- Prisma schema and migrations MUST exist only in `packages/db/prisma/**`.
- Prisma Client generation and export MUST be owned exclusively by `packages/db`.

### 5.2 Import Policy

- Allowed: `import { prisma } from "@workspace/db"`
- Forbidden:
  - Importing `@prisma/client` outside `packages/db`
  - Deep imports into `packages/db/**`
  - Re-exporting Prisma Client from any other package or application

**Access Rules**

- `apps/web` Client Components MUST NOT access the database directly or indirectly.
- `apps/web` Server-side code MAY access the database **only** through `apps/web/src/services/**` (see Section 6).
- `apps/worker` MAY access the database via `@workspace/db` but SHOULD do so via `@workspace/worker-shared/runtime` where possible.
- `packages/shared` MUST NOT depend on the database.
- `packages/worker-shared` MAY depend on the database **ONLY** in `runtime/**` (enforced above).

---

### 5.3 Query Discipline

- Route Handlers MUST NOT call `prisma.*` directly. They MUST delegate DB work to `apps/web/src/services/**` (see Section 6).
- All queries MUST use `select` (no implicit “select all”).
- Queries inside loops are forbidden.
- Multi-step logical operations MUST use transactions.

---

### 5.4 Migration Discipline

- `prisma db push` is forbidden.
- `prisma migrate dev` MUST be used for schema changes.
- Deployed migrations MUST never be edited or deleted.
- Manual migration SQL is forbidden by default.
- Schema and migration changes require explicit approval.

---

## 6. Web Layering Rules (App Router: RSC / Actions / Route Handlers)

### 6.1 Definitions (Enforced)

- **Route Handler**: `apps/web/src/app/api/**/route.ts`
- **Server Component**: default in `app/` unless marked `'use client'`
- **Server Action**: functions marked with `"use server"` semantics

These three MUST be treated as distinct layers with distinct responsibilities.

---

### 6.2 DB Access in `apps/web` (Enforced)

**Single Gate Rule**
- In `apps/web`, database access is allowed **ONLY** inside:
  - `apps/web/src/services/**`

**Route Handlers**
- `apps/web/src/app/api/**` Route Handlers MUST NOT access the database directly.
  - Forbidden direct access: importing `@workspace/db`, calling Prisma, executing SQL.
- Route Handlers MAY access DB only through `apps/web/src/services/**`.
- Route Handlers MUST NOT call DB-touching modules outside `apps/web/src/services/**`.
- Route Handlers responsibilities are limited to:
  - authn/authz
  - parsing + Zod validation
  - request/response normalization
  - calling `services/**`
  - error mapping and status codes

**Server Components / Server Actions**
- Server Components and Server Actions MUST NOT access DB directly.
- They MUST call `services/**` for any DB-backed data needs.

**Client Components**
- Client Components MUST NOT access DB directly or indirectly.
- Client Components MUST use approved data-fetching patterns (e.g., calling API endpoints, React Query hooks) and MUST NOT import server-only modules.

---

## 7. Root `package.json` Dependency Rules

- Root `package.json` MUST contain tooling-only dependencies.
- Root `dependencies` MUST remain empty.
- Runtime libraries are forbidden in root.

**Ownership**

- Web runtime dependencies belong to `apps/web`.
- Worker runtime dependencies belong to `apps/worker` and/or `packages/worker-shared`.
- Database dependencies belong to `packages/db`.
- Universal shared dependencies belong to `packages/shared`, respecting shared boundaries.

Any exception requires explicit justification and approval.

---

## 8. Worker App Enforcement (`apps/worker`)

- `apps/worker/**` contains only entry points and composition/wiring logic.
- Reused worker logic MUST be promoted to `@workspace/worker-shared`.
- Domain logic, browser automation logic, runtime logic, DB logic MUST NOT live in `apps/worker`.

Boundaries are enforced by import rules, not by discipline.

---

## 9. Generated Artifacts Rules (Enforced)

### 9.1 Commit Policy

- Any `generated` output directories are **build artifacts** and MUST NOT be committed.
- At minimum, the following MUST be treated as artifacts:
  - `**/generated/**`
  - `**/src/generated/**`
  - `**/dist/**`

### 9.2 Usage Policy

- Generated artifacts MUST NOT be used as the “source of truth” for shared interfaces/DTOs.
- Shared types MUST originate from `packages/shared/src/types/**`.
- LLM MUST treat generated directories as non-authoritative outputs:
  - do not edit
  - do not refactor
  - do not use as a stable import source unless explicitly allowed by package exports

---

## 10. Post-task Validation Rule (LLM)

- After an LLM completes a code-change task, `pnpm ci:check` MUST be executed at the repository root.
- “Task completed” means the LLM has finished making code changes and is about to report completion.
- Completion is forbidden if `pnpm ci:check` fails.
- Do not bypass this rule by running only a subset (lint/test/build separately).

---

## 11. Pre-Commit / Pre-Push Validation Rule (Human + LLM)

- Before any **commit or push**, you MUST run `pnpm ci:check` at the repository root.
- A commit/push is considered invalid (policy violation) if `pnpm ci:check` was not run or failed.
- This rule applies equally to:
  - humans
  - LLM-assisted changes
- automation scripts

---

## 12. Naming Conventions (Enforced)

### 12.0 Applicability

- This naming policy applies to **newly created files/folders** and **explicit rename tasks**.
- Pre-existing legacy names MAY remain until migrated by a scoped refactor ticket.
- Repository-wide bulk renames without an explicit, bounded migration plan are forbidden.

### 12.1 File Naming

- React component files (`.tsx`) MUST use `PascalCase`.
  - Example: `AdminSidebar.tsx`, `DateFilter.tsx`
- Non-component source files (`.ts` / utility `.tsx`) MUST use `camelCase`.
  - Example: `useFunnelQuery.ts`, `landingEventRetention.ts`, `dateFilter.test.ts`

### 12.2 Folder Naming

- Folders MUST use `kebab-case`.
  - Example: `admin-funnel`, `landing-events`

### 12.3 Next App Router Private Folders

- In `apps/web/src/app/**`, implementation-detail folders that are not route segments MUST use an underscore prefix.
  - Example: `_components`, `_hooks`, `_lib`
- The portion after `_` SHOULD follow existing local convention (`camelCase` or `kebab-case`) but MUST remain consistent within the same route subtree.

### 12.4 Required Exceptions

- Next.js reserved file conventions MUST be preserved as-is.
  - `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `template.tsx`, `default.tsx`
- Test and snapshot convention folders are allowed as-is.
  - `__tests__`, `__snapshots__`
- Locale folders MAY use BCP-47 style names.
  - Example: `ko`, `en`, `ja`, `zh-CN`
- Prisma migration directories under `packages/db/prisma/migrations/**` are immutable and exempt from folder naming rules.
- External/tooling contract filenames MAY keep upstream conventions when required for integration.
  - Example: `next-auth.d.ts`
- `apps/web/src/components/ui/**` MAY use kebab-case component filenames to keep upstream shadcn-style compatibility.
- Service-layer files under `apps/web/src/services/**` MUST use kebab-case with `.service` suffix.
  - Examples: `accommodations.service.ts`, `admin/funnel-clicks.service.ts`
- Service tests under `apps/web/src/services/**` MUST use kebab-case with `.service.test` suffix.
  - Examples: `accommodations.service.test.ts`, `admin/__tests__/funnel-clicks.service.test.ts`

---

## Final Note

Worker implementation, runtime, and infrastructure are expected to change over time.  
Job definitions and domain logic MUST remain stable across those changes.

The purpose of this ruleset is to keep boundaries enforceable, runtime stable on small instances, and changes reviewable and correct.

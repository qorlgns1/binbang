# RULES.md (Monorepo – Enforced)

## 0. Core Principles

- This repository is a monorepo with strict boundaries.
- Boundaries are enforced by package ownership and public APIs, not by convention.
- Any violation increases future migration and maintenance cost and is forbidden.

---

## Relationship to MONOREPO_PLAN

This document defines **enforced rules** based on the repository structure and decisions
described in `MONOREPO_PLAN.md`.

- `MONOREPO_PLAN.md` describes the **intended architecture and migration plan**.
- `rules.md` defines **non-negotiable constraints** that must be followed during and after migration.

In case of conflict:

- `rules.md` takes precedence for implementation and code review.
- `MONOREPO_PLAN.md` must be updated if architectural intent changes.

## 1. Monorepo Structure (Authoritative)

`apps/
web/ # Next.js (UI + Route Handlers)
worker/ # Background workers (cron, automation, jobs)

packages/
db/ # Prisma schema, migrations, DB client shared/ # Shared code with explicit sub-boundaries`

- New top-level directories are forbidden unless explicitly approved.
- Code ownership is defined by package, not by convenience.

---

## 2. Package Public API Rules

### 2.1 Deep Imports

- Deep imports into `packages/**/src/**` or internal files are forbidden.
- Only public entry points defined by package exports may be imported.

---

## 3. Shared Code Boundaries

### 3.1 `@shared` (universal)

**Purpose**  
Universal code that is safe for both web and worker environments.

**Allowed**

- Types, interfaces, DTOs
- Pure utilities with no side effects
- Constants, enums, mappings
- Formatting and parsing utilities
- Error types and error codes
- Usage of `Date` and `Intl`

**Forbidden**

- Network I/O such as `fetch` or HTTP clients
- Database access or Prisma usage (`@repo/db`)
- Node built-in modules (`fs`, `path`, `child_process`, etc.)
- Browser automation libraries (Puppeteer, Playwright)
- Direct access to `process.env`

`@shared` must remain pure and runtime-agnostic.

---

### 3.2 `@shared/worker` (worker-only)

- Node-only code is allowed.
- Browser automation, cron helpers, and job-related utilities are allowed.
- `apps/web/**` must not import `@shared/worker` in any context (client or server).

---

## 4. Worker Shared Structure

`@shared/worker` exposes exactly four categories:

`browser/ jobs/
runtime/
observability/`

Renaming, merging, or adding categories is forbidden.

---

### 4.1 `browser/`

- Responsible only for browser automation execution.
- Scheduling, retries, queues, and runtime control are forbidden.
- The execution environment (cron, queues, runtime details) must not be known.

Browser code must be execution-only.

---

### 4.2 `jobs/`

- Defines what work exists.
- Direct browser control is forbidden.
- Direct usage of cron or queue libraries is forbidden.
- Execution must always be delegated to `runtime`.

Jobs define work; they do not execute it.

---

### 4.3 `runtime/`

- Owns execution strategy and environment concerns.
- Allowed responsibilities include cron handling, queue adapters, retries, backoff, concurrency, and rate limiting.
- Business logic and browser-domain logic are forbidden.

Changing the runtime should not require changes to job definitions.

---

### 4.4 `observability/`

- Responsible for logging, metrics, tracing, and error normalization.
- Control flow changes and decision making are forbidden.
- Implicit global side effects are forbidden.

Observability records behavior but does not control it.

---

### 4.5 Worker Dependency Rules

**Allowed**

- `jobs` may depend on `runtime`
- `jobs` may depend on `observability`
- `browser` may depend on `observability`
- `runtime` may depend on `observability`

**Forbidden**

- `browser` depending on `jobs`
- `browser` depending on `runtime`
- `jobs` depending on `browser`
- `observability` depending on any domain logic

---

## 5. Prisma / Database Rules (`@repo/db`)

### 5.1 Ownership

- Prisma schema and migrations must exist only in `packages/db/prisma/**`.
- Prisma Client generation and export must be owned exclusively by `packages/db`.

### 5.2 Import Policy

- Allowed: `import { prisma } from "@repo/db"`
- Forbidden:
  - Importing `@prisma/client` outside `packages/db`
  - Deep imports into `packages/db/**`
  - Re-exporting Prisma Client from any other package or application

**Access Rules**

- `apps/web` Client Components must not access the database directly or indirectly.
- `apps/web` Server Components and Route Handlers may access the database via `@repo/db`.
- `apps/worker` may access the database via `@repo/db`.
- `packages/shared` must not depend on the database.

---

### 5.3 Query Discipline

- Route Handlers must not call `prisma.*` directly.
- All queries must use `select`.
- Queries inside loops are forbidden.
- Multi-step logical operations must use transactions.

---

### 5.4 Migration Discipline

- `prisma db push` is forbidden.
- `prisma migrate dev` must be used for schema changes.
- Deployed migrations must never be edited or deleted.
- Manual migration SQL is forbidden by default.
- Schema and migration changes require explicit approval.

---

## 6. Root `package.json` Dependency Rules

- Root `package.json` must contain tooling-only dependencies.
- Root `dependencies` must remain empty.
- Runtime libraries are forbidden in root.

**Ownership**

- Web runtime dependencies belong to `apps/web`.
- Worker runtime dependencies belong to `apps/worker`.
- Database dependencies belong to `packages/db`.
- Shared dependencies belong to `packages/shared`, respecting shared boundaries.

Any exception requires explicit justification and approval.

---

## 7. Enforcement Rule

- `apps/worker/**` contains only entry points and composition logic.
- Reused worker logic must be promoted to `@shared/worker`.
- Boundaries are enforced by import rules, not by discipline.

---

## 8. Post-task Validation Rule (LLM)

- After an LLM completes a code-change task, `pnpm ci:check` must be executed at the repository root.
- “Task completed” means the LLM has finished making code changes and is about to report completion.
- Completion is forbidden if `pnpm ci:check` fails.
- Do not bypass this rule by running only a subset (such as lint/test/build separately).

---

## Final Note

Worker implementation, runtime, and infrastructure are expected to change over time.  
Job definitions and domain logic must remain stable across those changes.

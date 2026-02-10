# RULES_SUMMARY.md

## Core

- This repository is a monorepo with strict, enforced boundaries.
- Boundaries are enforced by package ownership and public APIs, not convention.
- Rules use RFC-style intent:
  - `MUST / MUST NOT`: non-negotiable.
  - `SHOULD / SHOULD NOT`: strong default guidance.
  - `MAY`: allowed, not required.
- If `MONOREPO_PLAN.md` conflicts with implementation reality, `rules.md` wins and the plan must be updated.

---

## Authoritative Structure

- `apps/web`: Next.js UI, Server Components, Route Handlers.
- `apps/worker`: worker entrypoints and wiring only.
- `packages/db`: Prisma schema, migrations, DB client ownership.
- `packages/shared`: universal pure shared code.
- `packages/worker-shared`: worker-only shared runtime/jobs/browser/observability code.
- New top-level directories require explicit approval.

---

## Public API Rules

- Deep imports into `packages/**/src/**` or internal files are forbidden.
- Consumers must import only package `exports` entry points.

---

## Shared Boundary Rules

### `@workspace/shared` (universal)

- Must remain pure and runtime-agnostic.
- Allowed: types, DTOs, pure utils, constants/mappings, parse/format helpers, error types/codes, `Date`/`Intl`.
- Forbidden: network I/O, DB access, Node built-ins, scheduler/runtime controls, browser automation libs, direct `process.env`, worker runtime libs.

### `@workspace/worker-shared` (worker-only)

- Node-only code is allowed.
- `apps/web/**` must never import `@workspace/worker-shared`.
- Must not depend on web UI/runtime libraries (React/Next/shadcn).

---

## Worker-Shared Public Entrypoints

Only these public subpaths are allowed:

- `@workspace/worker-shared/browser`
- `@workspace/worker-shared/jobs`
- `@workspace/worker-shared/runtime`
- `@workspace/worker-shared/observability`

Rules:

- Do not rename/merge/add public categories.
- Internal folders may change, but public entrypoints must stay stable.

### Sub-boundary Highlights

- `browser/**`: execution only; no runtime control; no DB/env access.
- `jobs/**`: defines work only; delegates execution to runtime; no DB/env access.
- `runtime/**`: execution strategy owner; DB access allowed only here.
- `runtime/settings/**`: only place for env loading/validation/defaulting.
- `observability/**`: logs/metrics/tracing only; no DB/env access; no control flow ownership.

### Dependency Rules

- Allowed: `jobs -> runtime`, `jobs -> observability`, `browser -> observability`, `runtime -> observability`.
- Forbidden: `browser -> jobs`, `browser -> runtime`, `jobs -> browser`, `observability -> domain logic`.

---

## Prisma / Database Rules (`@workspace/db`)

- Prisma schema/migrations must live only in `packages/db/prisma/**`.
- Prisma Client must be owned/exported only by `packages/db`.
- Allowed DB import surface: `import { prisma } from "@workspace/db"`.
- Forbidden: `@prisma/client` outside `packages/db`, deep imports into `packages/db/**`, Prisma re-export outside db package.

Access policy:

- `apps/web` client components: no DB access.
- `apps/web` server-side code: DB access only via `apps/web/src/services/**`.
- `apps/worker`: may use DB directly, but should prefer `@workspace/worker-shared/runtime`.
- `packages/shared`: no DB dependency.
- `packages/worker-shared`: DB allowed only in `runtime/**`.

Query discipline:

- Route Handlers must never call `prisma.*` directly; delegate DB work to `apps/web/src/services/**`.
- All queries must use `select`.
- No queries inside loops.
- Multi-step logical operations must use transactions.

Migration discipline:

- `prisma db push` is forbidden.
- Use `prisma migrate dev` for schema changes.
- Never edit/delete deployed migrations.
- Manual migration SQL is forbidden by default.
- Schema/migration changes require explicit approval.

---

## Web Layering Rules (`apps/web`)

Distinct layers: Route Handlers, Server Components, Server Actions.

Single Gate Rule:

- In `apps/web`, DB access is allowed only inside `apps/web/src/services/**`.

Route Handlers (`apps/web/src/app/api/**/route.ts`):

- No direct DB access (`@workspace/db`, Prisma calls, SQL execution).
- DB access is allowed only through `services/**`.
- Must not call DB-touching modules outside `services/**`.
- Responsibilities: authn/authz, parsing+validation, normalization, service calls, error/status mapping.

Server Components / Server Actions:

- No direct DB access.
- Must call `services/**` for DB-backed needs.

Client Components:

- No direct/indirect DB access.
- Must use approved fetch patterns and avoid server-only imports.

---

## Root Dependency Rules

- Root `package.json` is tooling-only.
- Root `dependencies` must remain empty.
- Runtime libs are forbidden in root.
- Ownership:
  - Web runtime deps -> `apps/web`
  - Worker runtime deps -> `apps/worker` or `packages/worker-shared`
  - DB deps -> `packages/db`
  - Universal shared deps -> `packages/shared`

---

## Worker App Enforcement (`apps/worker`)

- `apps/worker/**` contains entrypoints and composition/wiring only.
- Reusable worker logic must be promoted to `@workspace/worker-shared`.
- Domain/browser/runtime/DB logic must not live in `apps/worker`.

---

## Generated Artifact Rules

- Build output directories must not be committed:
  - `**/generated/**`
  - `**/src/generated/**`
  - `**/dist/**`
- Generated outputs must not be the source of truth for shared DTOs/types.
- Shared types must originate from `packages/shared/src/types/**`.
- LLMs must treat generated dirs as non-authoritative (no edit/refactor/stable imports unless exports explicitly allow).

---

## Validation Rules

- After LLM code changes, `pnpm ci:check` at repo root is mandatory before reporting completion.
- Before any commit/push (human or LLM), `pnpm ci:check` is mandatory and must pass.
- Running partial checks as a bypass is forbidden.

---

## Principle

Worker runtime/infrastructure will evolve.
Job definitions and domain logic must remain stable across those changes.

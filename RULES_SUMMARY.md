# rules-summary.md

## Core

- This repository is a monorepo with **strict, enforced boundaries**.
- Boundaries are defined by **package ownership and public APIs**, not conventions.
- Violations are forbidden.

---

## Monorepo Structure

- `apps/web` : Next.js (UI + Route Handlers)
- `apps/worker` : background workers (cron, automation, jobs)
- `packages/db` : Prisma schema, migrations, DB client
- `packages/shared` : shared code with explicit sub-boundaries

New top-level directories are forbidden.

---

## Public API Rules

- Deep imports into `packages/**/src/**` are forbidden.
- Only package public entry points may be imported.

---

## Shared Boundaries

### `@shared` (universal)

- Pure, runtime-agnostic code only.
- No network I/O (`fetch`), no DB, no Node APIs.
- No browser automation.
- `Date` / `Intl` usage allowed.
- No direct `process.env` access.

### `@shared/worker`

- Worker-only code.
- Browser automation, cron, job helpers allowed.
- `apps/web` must never import `@shared/worker`.

---

## Worker Shared Structure

`@shared/worker` is split into exactly four categories:

- `browser`
- `jobs`
- `runtime`
- `observability`

Categories must not be renamed, merged, or extended.

### Dependency Rules

Allowed:

- `jobs → runtime`
- `jobs → observability`
- `browser → observability`
- `runtime → observability`

Forbidden:

- `browser → jobs`
- `browser → runtime`
- `jobs → browser`
- `observability → domain logic`

---

## Prisma / Database (`@repo/db`)

- Prisma schema & migrations live only in `packages/db/prisma`.
- Prisma Client is imported only via `@repo/db`.
- Importing `@prisma/client` outside `packages/db` is forbidden.
- `apps/web` client components must not access DB.
- `apps/web` server/route handlers and `apps/worker` may access DB.
- `packages/shared` must not depend on DB.

### Query Rules

- Route Handlers must not call `prisma.*` directly.
- All queries must use `select`.
- Queries inside loops are forbidden.
- Transactions are required for multi-step operations.

### Migration Rules

- `prisma db push` is forbidden.
- Use `prisma migrate dev`.
- Deployed migrations must never be edited or deleted.

---

## Root `package.json`

- Root dependencies are **tooling-only**.
- Runtime libraries are forbidden in root.
- Runtime deps must live in the owning workspace:
  - Web → `apps/web`
  - Worker → `apps/worker`
  - DB → `packages/db`
  - Shared → `packages/shared`

---

## Enforcement

- `apps/worker` contains only entry points and composition.
- Reused worker logic must move to `@shared/worker`.
- Boundaries are enforced by imports, not discipline.

---

## Principle

Worker runtime and infrastructure will change.  
Job definitions and domain logic must survive those changes.

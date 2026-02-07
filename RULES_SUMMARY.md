# 🔒 LLM System Prompt (Project Rules Summary)

You are working in a repository with **strict, mandatory coding rules**.

**Before writing or modifying any code, you MUST read and follow `rules.md`.**  
If any instruction conflicts with `rules.md`, **`rules.md` always takes priority**.  
If you are unsure, **STOP and ASK instead of guessing**.

---

## 1. Core Behavior Rules

- Do **NOT guess** missing requirements, types, or behavior.
- Do **NOT invent structure, APIs, or logic**.
- If information is missing:
  - Add `TODO` with reason **or**
  - Ask up to 3 clear questions.

- Do **NOT** refactor structure, move files, or create new files unless explicitly requested.

---

## 2. Project Structure & Boundaries

- **No new files or folders** unless explicitly requested.
- Always modify existing files first.
- Folder names: lowercase, kebab-case.
- Dependency direction is fixed:

  `client → api → service → db
worker → service → db`

- Client code must never import:
  - Prisma
  - DB logic
  - Node-only modules

---

## 3. TypeScript Rules

- `any` is **forbidden** (including `as any`).
- Use `unknown` only at boundaries, and narrow immediately.
- **All functions MUST have explicit return types** (exported or not).
- Async functions MUST return `Promise<T>`.
- React components must NOT specify return types.
- TypeScript `enum` is forbidden → use string unions.
- `switch` on unions MUST be exhaustive (no `default`).

---

## 4. React / Next.js (App Router)

- `"use client"` only when required.
  - MUST include a file-level comment explaining why.

- No `fetch` inside components.
- Client data access ONLY via TanStack Query hooks.
- `useEffect` is for side effects only:
  - No derived state
  - No empty dependency abuse
  - No disabling exhaustive-deps

- Split components if:
  - ≥3 conditions OR ≥3 states OR ≥150 lines JSX

- Event handlers:
  - Props: `on*`
  - Internal: `handle*`

---

## 5. TanStack Query Rules

- `src/app/**` = composition only (no queries/mutations).
- `src/app/api/**` = Route Handlers only.
- All queries/mutations MUST be wrapped in custom hooks.
- Naming:
  - Query: `useXQuery`
  - Infinite: `useXInfiniteQuery`
  - Mutation: `useVerbXMutation`

- `queryKeys` are **centralized in `src/lib/queryKeys.ts` only**.
- Mutations MUST:
  - use `useMutation`
  - invalidate or sync cache

- Optimistic updates MUST include rollback.
- `staleTime/gcTime/retry` follow global policy unless explicitly justified.

---

## 6. Prisma Rules

- Prisma Client:
  - Server / Worker only
  - Single instance

- Route Handlers must NOT call `prisma.*` directly.
- Queries MUST specify `select`.
- `include` only with explicit justification.
- No queries inside loops (N+1 forbidden).
- Use transactions for logical multi-step operations.
- Schema/migration changes are forbidden unless explicitly requested.

---

## 7. Validation & Data Boundaries

- Use zod **only at boundaries**:
  - API input/output
  - env
  - external data

- No re-validation inside domain logic.
- `safeParse` by default.
- Worker inputs are also boundary inputs.
- Schema/mapper logic should have tests when feasible.

---

## 8. Error & Logging Rules

- Separate **user-facing errors** and **log errors**.
- Never log secrets, tokens, or PII.
- `warn/error` logs MUST include:
  - `scope`, `op`, `message`, `cause`, `meta`

- API responses must NOT include stack traces or raw errors.
- Worker errors must be isolated per job (no global crash).
- Never swallow errors.

---

## 9. Testing Rules

- Tests are REQUIRED when modifying:
  - Shared utilities
  - Schemas
  - DTO/mappers
  - Error mapping
  - `queryKeys`

- UI tests are excluded by default.
- No real network, DB, or time dependency in tests.
- If a test is skipped, you MUST explain why and propose an alternative.

---

## 10. UI Rules (shadcn v3 + Tailwind v4)

- UI primitives live ONLY in `src/components/ui/*`.
- Feature-level UI is allowed, but:
  - If reusable, propose promotion to `ui/` (do NOT do it).

- Use **Tailwind semantic tokens ONLY**:
  - `bg-card`, `text-muted-foreground`, etc.
  - No hardcoded colors.

- Styles are managed in `src/app/globals.css` ONLY.
- `cn` must be imported from `@/lib/utils`.
- Radix imports must use `@radix-ui/react-*`.
- Extend variants/sizes via `cva` only.

---

## 11. Final Rule

**If you are about to violate any rule above: STOP and ASK.**  
**Never “just make it work”.**

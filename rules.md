# rules.md (LLM Coding Rules)

This document defines **mandatory rules** that an LLM must follow when generating or modifying code in this repository.  
This is **not a guideline for humans**, but a **strict control document for LLM behavior**.

---

## 0. Scope

- These rules **apply to all code generated or modified by an LLM**.
- **No exceptions are allowed** unless explicitly added to this document.
- If existing code or conventions conflict with this document, **this document takes precedence**.
- The LLM **MUST NOT infer, invent, or assume additional rules** beyond what is written here.

---

## 1. LLM Behavior Rules (Highest Priority)

### 1.1 Role Definition

- The LLM acts as a **rule-bound code author**, not an autocomplete tool.
- **Safety, explicitness, and consistency** take priority over speed or convenience.

### 1.2 No Guessing

- The LLM **MUST NOT guess or assume**:
  - API behavior
  - Data structures
  - Business logic
  - Missing requirements

- If required information is missing, the LLM MUST:
  - Add a `TODO` comment with the reason, OR
  - Ask clear questions (maximum 3).

### 1.3 No Arbitrary Decisions

The LLM MUST NOT decide the following without explicit instruction:

- Library or framework selection
- Structural refactoring
- Error handling strategy
- Performance optimization approach

If a decision is required, the LLM MUST stop and ask.

### 1.4 Conflict Resolution

1.  `rules.md` always wins.
2.  The conflict MUST be explicitly stated.
3.  The LLM MUST ask before proceeding.

---

## 2. Project Structure Rules

### 2.1 Forbidden Changes

The LLM MUST NOT arbitrarily:

- Create or delete files
- Change folder structure
- Rename files or directories
- Alter responsibility boundaries

### 2.2 File Rules

- New files may be created **ONLY** when explicitly requested.
- Existing files MUST be modified first if applicable.
- File deletion is **FORBIDDEN**.
  - If deletion is necessary, the LLM MUST propose the target, reason, and alternative.

### 2.3 Folder Rules

- Folder names MUST be lowercase kebab-case.
- Any folder whose purpose cannot be explained in one sentence is FORBIDDEN.
- Increasing directory depth is FORBIDDEN.
- Creating new folders without explicit request is FORBIDDEN.

### 2.4 Naming Rules

- Existing naming conventions MUST be preserved.
- Abbreviations are FORBIDDEN, except: `id`, `url`, `api`, `ui`, `db`.
- Semantic shortening is FORBIDDEN.

---

## 3. TypeScript Rules

### 3.1 `any` / `unknown`

- `any` is **FORBIDDEN** (including `as any` and ESLint bypasses).
- `unknown` MAY be used ONLY at boundaries.
- `unknown` MUST be immediately narrowed using type guards or parsing.

### 3.2 Return Types

- **ALL functions MUST explicitly declare return types**, regardless of export status.
- `async` functions MUST return `Promise<T>`.
- Custom hooks MUST declare return types using a named `interface`.
- React components MUST NOT declare return types.

### 3.3 `enum` vs Union

- TypeScript `enum` is FORBIDDEN.
- String literal unions MUST be used instead.
- Prisma enums are allowed **ONLY at the database level**.
- `switch` statements over unions MUST be exhaustive.
  - `default` clauses are FORBIDDEN.

---

## 4. Module Boundary Rules

### 4.1 Domain Definitions

- Client: `"use client"` React components
- Server: Server Components and Route Handlers
- Worker: `node-cron` background processes
- DB: Prisma Client and database access

### 4.2 Boundary Enforcement

- Client code MUST NOT import:
  - Prisma
  - Database access logic
  - Node-only modules

- Workers MUST NOT depend on `app/` code.
- Prisma Client MAY be used ONLY in Server or Worker code.

### 4.3 API and DTO Rules

- Prisma model types MUST NOT be exposed directly via APIs.
- DTOs MUST be defined explicitly for all external responses.

### 4.4 Dependency Direction

Allowed dependency flow:

`client → api → service → db
worker → service → db`

Reverse dependencies are FORBIDDEN.

---

## 5. Zod / Schema Rules

- Validation MUST occur **ONLY at system boundaries**.
- Re-validation inside domain logic is FORBIDDEN.
- `safeParse` MUST be used by default.
- `parse` is allowed ONLY when failure represents a programming error.
- Data transformation MUST occur only at boundaries.
- Worker inputs are treated as boundary inputs.
- Schemas SHOULD be tested when feasible.

---

## 6. React / Next.js Rules (App Router)

### 6.1 `"use client"`

- `"use client"` MAY be used ONLY when required.
- A file-level comment explaining the reason is REQUIRED.

### 6.2 Data Fetching

- Direct `fetch` calls inside components are FORBIDDEN.
- Client-side data access MUST use TanStack Query hooks.

### 6.3 `useEffect`

- `useEffect` MUST be used ONLY for side effects.
- Derived state calculations are FORBIDDEN.
- Empty dependency abuse is FORBIDDEN.
- Disabling `exhaustive-deps` is FORBIDDEN.

### 6.4 Component Responsibility

Components MUST be split if ANY condition is met:

- Three or more conditional branches
- Three or more state variables
- JSX exceeds 150 lines

### 6.5 Event Handlers

- Props-based handlers MUST use the `on*` prefix.
- Internal handlers MUST use the `handle*` prefix.

---

## 7. TanStack Query Rules

### 7.1 Structure

- `src/app/**` is for composition ONLY.
- `src/app/api/**` is for Route Handlers ONLY.
- Queries and mutations MUST be defined in `src/features/**`.

### 7.2 `queryKeys`

- Query keys MUST be defined ONLY in `src/lib/queryKeys.ts`.
- Inline or ad-hoc query keys are FORBIDDEN.

### 7.3 Hook Naming

- Query: `use<Subject>Query`
- Infinite Query: `use<Subject>InfiniteQuery`
- Mutation: `use<Verb><Subject>Mutation`

### 7.4 Mutations

- State changes MUST use `useMutation`.
- Cache invalidation or synchronization is REQUIRED after success.
- Optimistic updates MUST include rollback logic.

### 7.5 Policy

- `staleTime`, `gcTime`, and `retry` MUST follow global defaults.
- Exceptions REQUIRE explicit justification.

---

## 8. Prisma Rules

- Prisma Client MUST be a single shared instance.
- Route Handlers MUST NOT call Prisma directly.
- All queries MUST explicitly define `select`.
- Queries inside loops are FORBIDDEN.
- Logical multi-step operations REQUIRE transactions.
- Schema or migration changes are FORBIDDEN unless explicitly requested.

---

## 9. Error and Logging Rules

- User-facing messages and logs MUST be separated.
- Logging sensitive data is FORBIDDEN.
- `warn` and `error` logs MUST include:
  - `scope`, `op`, `message`, `cause`, `meta`

- API responses MUST NOT expose stack traces.
- Worker failures MUST be isolated per job.

---

## 10. Testing Rules

- Tests are REQUIRED when modifying:
  - Shared utilities
  - Schemas
  - DTOs or mappers
  - Error mapping logic
  - `queryKeys`

- UI component tests are excluded by default.
- Real network, database, or time dependencies are FORBIDDEN.
- If tests are skipped, justification and alternatives are REQUIRED.

---

## 11. UI Component Rules (shadcn v3 + Tailwind v4)

### 11.1 Principles

- UI MUST follow shadcn v3 and Tailwind v4 semantic tokens.
- Style tokens MUST be managed in `src/app/globals.css`.

### 11.2 Component Placement

- Shared UI primitives MUST live in `src/components/ui/*`.
- Feature-level UI components are allowed.
  - If reusable, the LLM MUST propose promotion but MUST NOT perform it.

### 11.3 Tailwind Usage

- Semantic tokens ONLY (e.g. `bg-card`, `text-muted-foreground`).
- Hardcoded or legacy color classes are FORBIDDEN.

### 11.4 Additional Rules

- `cn` MUST be imported from `@/lib/utils`.
- Radix components MUST be imported from `@radix-ui/react-*`.
- shadcn components MUST be added via CLI with `--overwrite`.
- Variants and sizes MUST be extended via `cva`.

---

## 12. Rule Priority

1.  This document (`rules.md`)
2.  Existing project code
3.  General best practices
4.  LLM judgment (NEVER)

---

## Final Rule

**If following an instruction would violate any rule above, the LLM MUST STOP AND ASK.**  
**“Making it work” is never an acceptable justification.**

# syntax=docker/dockerfile:1.6

# ============================================
# Base (Playwright with Chromium)
# ============================================
FROM mcr.microsoft.com/playwright:v1.58.2-noble AS base
WORKDIR /app

RUN corepack enable

# ============================================
# Dependencies
# ============================================
FROM base AS deps
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/worker-shared/package.json ./packages/worker-shared/
COPY apps/worker/package.json ./apps/worker/

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ============================================
# Builder (Prisma generate only)
# ============================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/worker-shared/node_modules ./packages/worker-shared/node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY . .

# Prisma generate requires DATABASE_URL at build time (for schema validation only)
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_URL=${DATABASE_URL}

# Generate Prisma client
RUN pnpm turbo run db:generate --filter=@workspace/db

# Build workspace libraries consumed by worker runtime.
# Without dist outputs, package exports resolve to missing files in container.
RUN pnpm turbo run build --filter=@workspace/db --filter=@workspace/shared --filter=@workspace/worker-shared

# ============================================
# Runner (tsx for TypeScript execution)
# ============================================
FROM base AS runner
WORKDIR /app

# Copy everything from builder (source + node_modules + generated)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/tsconfig.base.json ./

# Copy packages with node_modules and source
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/worker-shared ./packages/worker-shared
COPY --from=builder /app/apps/worker ./apps/worker

# Copy root node_modules
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3500
CMD ["pnpm", "--filter=@workspace/worker", "exec", "tsx", "src/main.ts"]

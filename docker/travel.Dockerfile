# syntax=docker/dockerfile:1.6

# ============================================
# Base
# ============================================
FROM node:24-slim AS base
WORKDIR /app

RUN corepack enable

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

# ============================================
# Dependencies
# ============================================
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY apps/travel/package.json ./apps/travel/

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ============================================
# Builder
# ============================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/travel/node_modules ./apps/travel/node_modules
COPY . .

ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

# Prisma generate requires DATABASE_URL at build time (for schema validation only)
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_URL=${DATABASE_URL}

RUN pnpm turbo run build --filter=@workspace/travel

# ============================================
# Runner
# ============================================
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/travel/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/travel/.next/static ./apps/travel/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/travel/public ./apps/travel/public

USER nextjs
EXPOSE 3300
CMD ["node", "apps/travel/server.js"]

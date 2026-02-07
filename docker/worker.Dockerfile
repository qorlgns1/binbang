# syntax=docker/dockerfile:1.6

# ============================================
# Base (with Chromium for Puppeteer)
# ============================================
FROM node:24-slim AS base
WORKDIR /app

RUN corepack enable

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# ============================================
# Dependencies
# ============================================
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
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
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY . .

# Prisma generate requires DATABASE_URL at build time (for schema validation only)
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV DATABASE_URL=${DATABASE_URL}

# Generate Prisma client only (no TypeScript build)
RUN pnpm turbo run db:generate --filter=@workspace/db

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
COPY --from=builder /app/apps/worker ./apps/worker

# Copy root node_modules
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3500
CMD ["pnpm", "--filter=@workspace/worker", "exec", "tsx", "src/main.ts"]

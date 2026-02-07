# Monorepo Migration Plan

pnpm workspace + Turborepo 기반 모노레포 전환 계획 (개선: test 파일 포함, BullMQ/Redis 구체화, Prisma 통합 등)

## 1. 목표 구조 (Tree)

```
accommodation-monitor/
├── apps/
│   ├── web/                          # Next.js 15 App Router
│   │   ├── src/
│   │   │   ├── app/                  # App Router pages
│   │   │   ├── components/           # React components
│   │   │   ├── features/             # TanStack Query hooks
│   │   │   ├── services/             # API service layer
│   │   │   └── lib/                  # Web-only utilities
│   │   │       ├── auth.ts
│   │   │       ├── admin.ts
│   │   │       ├── rbac.ts
│   │   │       ├── queryKeys.ts
│   │   │       ├── priceFormat.ts
│   │   │       ├── rateLimit.ts
│   │   │       ├── auditLog.ts
│   │   │       ├── url-parser.ts
│   │   │       ├── url-parser.test.ts  # Test 파일 추가
│   │   │       └── utils.ts          # Tailwind cn()
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── worker/                       # BullMQ + Playwright Worker
│       ├── src/
│       │   ├── main.ts               # 진입점 (BullMQ worker)
│       │   ├── queues/               # BullMQ queue definitions
│       │   ├── jobs/                 # Job processors
│       │   │   ├── check.job.ts      # 숙소 체크 job
│       │   │   └── statusUtils.test.ts  # Test 파일 추가
│       │   ├── cron/                 # Cron scheduler (BullMQ repeatable jobs로 대체 가능)
│       │   │   ├── scheduler.ts
│       │   │   └── config.ts
│       │   └── lib/                  # Worker-only utilities
│       │       └── heartbeat/
│       ├── Dockerfile
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── db/                           # Prisma 공유
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # 전체 schema (schema.worker.prisma 통합)
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── client.ts             # Prisma Client export
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── shared/                       # 공유 모듈
│       ├── src/
│       │   ├── types/
│       │   │   ├── checker.ts
│       │   │   ├── accommodation.ts
│       │   │   └── index.ts
│       │   ├── checkers/             # Playwright 체커
│       │   │   ├── index.ts
│       │   │   ├── baseChecker.ts
│       │   │   ├── airbnb.ts
│       │   │   ├── agoda.ts
│       │   │   ├── browserPool.ts
│       │   │   ├── browser.ts
│       │   │   ├── constants.ts
│       │   │   ├── utils.ts
│       │   │   ├── utils.test.ts     # Test 파일 추가
│       │   │   ├── priceParser.ts
│       │   │   └── priceParser.test.ts  # Test 파일 추가
│       │   ├── settings/
│       │   │   ├── index.ts          # settings.ts
│       │   │   └── env.ts
│       │   ├── selectors/
│       │   │   └── index.ts          # selectors.ts
│       │   ├── kakao/
│       │   │   └── message.ts
│       │   └── index.ts              # barrel export
│       ├── tsconfig.json
│       └── package.json
│
├── docker/
│   ├── web.Dockerfile
│   └── worker.Dockerfile
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json                      # Root package.json
├── tsconfig.base.json                # 공유 tsconfig
└── docker-compose.production.yml
```

## 2. 패키지별 역할 및 파일 목록

### 2.1 `apps/web` - Next.js Web Application

| 카테고리     | 파일/디렉토리                                         | 원본 위치                           |
| ------------ | ----------------------------------------------------- | ----------------------------------- |
| App Router   | `src/app/**`                                          | `src/app/`                          |
| Components   | `src/components/**`                                   | `src/components/`                   |
| Features     | `src/features/**`                                     | `src/features/`                     |
| Services     | `src/services/**`                                     | `src/services/`                     |
| Auth         | `src/lib/auth.ts`, `src/lib/auth.test.ts`             | `src/lib/auth.ts` (test 추가)       |
| Admin        | `src/lib/admin.ts`                                    | `src/lib/admin.ts`                  |
| RBAC         | `src/lib/rbac.ts`                                     | `src/lib/rbac.ts`                   |
| Query Keys   | `src/lib/queryKeys.ts`                                | `src/lib/queryKeys.ts`              |
| Price Format | `src/lib/priceFormat.ts`                              | `src/lib/priceFormat.ts`            |
| Rate Limit   | `src/lib/rateLimit.ts`, `src/lib/rateLimit.test.ts`   | `src/lib/rateLimit.ts` (test 추가)  |
| Audit Log    | `src/lib/auditLog.ts`                                 | `src/lib/auditLog.ts`               |
| URL Parser   | `src/lib/url-parser.ts`, `src/lib/url-parser.test.ts` | `src/lib/url-parser.ts` (test 추가) |
| Utils        | `src/lib/utils.ts`, `src/lib/utils.test.ts`           | `src/lib/utils.ts` (test 추가)      |

### 2.2 `apps/worker` - BullMQ + Playwright Worker

| 카테고리  | 파일/디렉토리                                           | 원본 위치                                                |
| --------- | ------------------------------------------------------- | -------------------------------------------------------- |
| Entry     | `src/main.ts`                                           | 새 생성 (worker.ts 기반)                                 |
| Queues    | `src/queues/**`                                         | 새 생성 (BullMQ)                                         |
| Jobs      | `src/jobs/check.job.ts`, `src/jobs/statusUtils.test.ts` | `src/lib/cron/processor.ts` (test 추가)                  |
| Cron      | `src/cron/scheduler.ts`, `src/cron/config.ts`           | `src/lib/cron/config.ts` (BullMQ repeatable jobs로 전환) |
| Heartbeat | `src/lib/heartbeat/**`                                  | `src/lib/heartbeat/`                                     |

### 2.3 `packages/db` - Prisma 공유

| 카테고리   | 파일/디렉토리          | 원본 위치                                          |
| ---------- | ---------------------- | -------------------------------------------------- |
| Schema     | `prisma/schema.prisma` | `prisma/schema.prisma` (schema.worker.prisma 통합) |
| Migrations | `prisma/migrations/**` | `prisma/migrations/`                               |
| Client     | `src/client.ts`        | 새 생성 (prisma.ts 기반)                           |

### 2.4 `packages/shared` - 공유 모듈

| 카테고리  | 파일/디렉토리                                                          | 원본 위치                               |
| --------- | ---------------------------------------------------------------------- | --------------------------------------- |
| Types     | `src/types/**`                                                         | `src/types/`                            |
| Checkers  | `src/checkers/**` (test 파일 포함: utils.test.ts, priceParser.test.ts) | `src/lib/checkers/`                     |
| Settings  | `src/settings/**`                                                      | `src/lib/settings.ts`, `src/lib/env.ts` |
| Selectors | `src/selectors/**`                                                     | `src/lib/selectors.ts`                  |
| Kakao     | `src/kakao/**`                                                         | `src/lib/kakao/`                        |

## 3. Migration 단계

1. **Root 설정 파일 생성**  
   pnpm-workspace.yaml, turbo.json, tsconfig.base.json, root package.json 생성. 기존 package.json 수정 (devDeps: turbo 추가).

2. **packages/db 구성**  
   prisma/schema.prisma 이동 (schema.worker.prisma 통합 – worker subset generate: prisma generate --schema=... --sql). `pnpm --filter @repo/db run generate` 테스트.

3. **packages/shared 구성**  
   공유 파일 이동 (checkers, settings 등). test 파일 포함. Playwright peerDeps 선언. `pnpm install` 후 import 경로 수정 (@repo/shared).

4. **apps/web 구성**  
   기존 src/ → apps/web/src/ 이동. next.config.ts에 transpilePackages 추가. `turbo run build --filter=@repo/web` 테스트.

5. **apps/worker 구성**  
   worker 파일 이동. Puppeteer → Playwright migration (browserPool.ts 변환). cron → BullMQ repeatable jobs. `turbo run dev --filter=@repo/worker`.

6. **Docker & Redis 추가**  
   docker-compose.production.yml에 redis 서비스 추가 (volumes: redis-data:/data, restart: unless-stopped). BullMQ connection 설정.

7. **테스트 & 배포**  
   `turbo run test/lint` 실행. Vercel root directory: apps/web. CI yml turbo로 업데이트.

8. **원본 아카이브**  
   기존 src/ 백업 (git branch or zip).

## 4. Prisma 공유

- 전체 schema.prisma 사용, worker에서 subset select (rules.md 8: explicit select).
- Generate: turbo dependsOn으로 순서 보장.

## 5. Deps 관리

- worker: playwright, bullmq, ioredis.
- web: React/Next 유지.
- pnpm hoist-patterns: [pnpmfile.js에 '*@playwright*' nohoist 추가] – deps 충돌 방지.

## 6. Docker 예시

### web.Dockerfile (multi-stage)

```dockerfile
FROM node:24 AS base
WORKDIR /app
COPY pnpm-lock.yaml ./
RUN corepack enable && pnpm fetch

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
RUN pnpm install --offline

FROM base AS builder
COPY . .
RUN pnpm turbo run build --filter=@repo/web

FROM base AS runner
COPY --from=builder /app/apps/web/.next/standalone ./
CMD ["node", "server.js"]
```

### worker.Dockerfile (Playwright deps)

```dockerfile
FROM mcr.microsoft.com/playwright:v1.50.0-noble AS base
WORKDIR /app
COPY pnpm-lock.yaml ./
RUN corepack enable && pnpm fetch

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY apps/worker/package.json apps/worker/
RUN pnpm install --offline

FROM base AS builder
COPY . .
RUN pnpm turbo run build --filter=@repo/worker

FROM base AS runner
COPY --from=builder /app/apps/worker/dist ./
CMD ["node", "main.js"]
```

### docker-compose.production.yml (Redis 추가)

```yaml
services:
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

## 7. 잠재 이슈 및 해결책

### 7.1 tsconfig Path Aliases

**이슈:** 기존 `@/` alias가 앱별로 다르게 동작

**해결:**

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@repo/db": ["packages/db/src"],
      "@repo/shared": ["packages/shared/src"]
    }
  }
}

// apps/web/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@repo/db": ["../../packages/db/src"],
      "@repo/shared": ["../../packages/shared/src"]
    }
  }
}
```

### 7.2 Vercel 배포

**이슈:** Vercel은 monorepo root가 아닌 apps/web 기준 빌드

**해결:**

1. Vercel 프로젝트 설정에서 Root Directory를 `apps/web`으로 설정
2. `vercel.json` 추가:

```json
{
  "buildCommand": "cd ../.. && pnpm turbo run build --filter=@repo/web",
  "outputDirectory": ".next"
}
```

### 7.3 Prisma Generate 순서

**이슈:** 다른 패키지 빌드 전에 Prisma client 생성 필요

**해결:**

```json
// turbo.json
{
  "tasks": {
    "@repo/db#generate": {
      "cache": false,
      "outputs": ["src/generated/**"]
    },
    "build": {
      "dependsOn": ["^build", "@repo/db#generate"]
    }
  }
}
```

### 7.4 packages/shared의 Playwright 의존성

**이슈:** web 앱에서 shared를 import하면 Playwright도 번들됨

**해결:**

1. `packages/shared`에서 Playwright를 peerDependency로 선언
2. 체커 모듈을 dynamic import로 분리:

```typescript
// packages/shared/src/checkers/index.ts
export async function loadChecker(platform: Platform) {
  if (typeof window !== 'undefined') {
    throw new Error('Checkers can only be used in server/worker environment');
  }
  // Dynamic import
  const { checkAirbnb, checkAgoda } = await import('./platforms');
  return platform === 'AIRBNB' ? checkAirbnb : checkAgoda;
}
```

### 7.5 환경 변수 관리

**이슈:** 앱별로 다른 환경 변수 필요

**해결:**

```
.env                    # 공통 (DATABASE_URL)
apps/web/.env.local     # Web 전용 (NEXTAUTH_*)
apps/worker/.env.local  # Worker 전용 (REDIS_URL, KAKAO_*)
```

### 7.6 Turborepo 캐싱

**이슈:** Prisma schema 변경 시 캐시 무효화 필요

**해결:**

```json
// turbo.json
{
  "globalDependencies": ["packages/db/prisma/schema.prisma"]
}
```

### 7.7 Type Export 충돌

**이슈:** packages/db의 Prisma 타입과 packages/shared 타입 충돌 가능

**해결:**

- `@repo/db`에서 Prisma 타입만 export
- `@repo/shared`에서 커스텀 타입만 export
- 명확한 네이밍: `PrismaUser` vs `UserWithDetails`

---

### 7.8 pnpm Hoist Patterns

**이슈:** Playwright deps가 web에 hoist됨.  
**해결:** .npmrc에 hoist-pattern[]='!@playwright/\*' 추가.

### 7.9 Env Validation

**이슈:** 앱별 env 다름.  
**해결:** packages/shared/env.ts에 zod.safeParse (rules.md 5 boundaries).

## 8. 파일 구성 요약

### Root Level Files

| 파일                            | 설명                         |
| ------------------------------- | ---------------------------- |
| `pnpm-workspace.yaml`           | Workspace 정의               |
| `turbo.json`                    | Turborepo 태스크 설정        |
| `tsconfig.base.json`            | 공유 TypeScript 설정         |
| `package.json`                  | Root dependencies (turbo 등) |
| `docker-compose.production.yml` | 프로덕션 Docker 설정         |

### Workspace Packages

| 패키지         | 용도                     | 주요 export                          |
| -------------- | ------------------------ | ------------------------------------ |
| `@repo/db`     | Prisma 클라이언트 & 타입 | `prisma`, Prisma models              |
| `@repo/shared` | 공유 유틸리티            | checkers, settings, selectors, types |
| `@repo/web`    | Next.js 웹앱             | -                                    |
| `@repo/worker` | BullMQ Worker            | -                                    |

---

## 9. apps/web Configuration Templates

### apps/web/next.config.ts

```typescript
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,

  // Monorepo: transpile workspace packages
  transpilePackages: ["@workspace/db", "@workspace/shared"],

  // Monorepo: output file tracing for standalone build
  outputFileTracingRoot: path.join(__dirname, "../../"),

  // Webpack configuration for workspace packages
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@workspace/db": path.resolve(__dirname, "../../packages/db/src"),
      "@workspace/shared": path.resolve(__dirname, "../../packages/shared/src"),
    };
    return config;
  },
};

export default nextConfig;
```

### apps/web/tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "ES2023"],
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@workspace/db": ["../../packages/db/src"],
      "@workspace/shared": ["../../packages/shared/src"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### apps/web/package.json

```json
{
  "name": "@workspace/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@workspace/db": "workspace:*",
    "@workspace/shared": "workspace:*",
    "@next-auth/prisma-adapter": "^1.0.7",
    "@tanstack/react-query": "^5.90.20",
    "bcryptjs": "^3.0.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.563.0",
    "next": "^15.5.12",
    "next-auth": "^4.24.11",
    "radix-ui": "^1.4.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "2.15.4",
    "shadcn": "^3.8.1",
    "tailwind-merge": "^3.4.0",
    "tw-animate-css": "^1.4.0",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@next/eslint-plugin-next": "^16.1.6",
    "@tailwindcss/postcss": "^4.1.18",
    "@tanstack/react-query-devtools": "^5.91.3",
    "@types/react": "^19.2.10",
    "@types/react-dom": "^19.0.2",
    "postcss": "^8.4.49",
    "tailwindcss": "^4.1.18"
  }
}
```

---

## 10. Checklist

- [x] pnpm-workspace.yaml 수정 (apps/*, packages/*)
- [x] turbo.json 생성
- [x] tsconfig.base.json 생성
- [x] root package.json 수정 (turbo scripts)
- [x] packages/db 구성 및 테스트
- [x] packages/shared 구성 (Puppeteer 기반 유지, Playwright 전환은 추후)
- [x] apps/web 구성 및 빌드 테스트
- [x] apps/worker 구성 (node-cron 기반 유지, BullMQ 전환은 추후)
- [x] Docker 설정 (docker/web.Dockerfile, docker/worker.Dockerfile)
- [x] 원본 src/, public/, prisma/ 삭제
- [x] Docker 이미지 빌드 테스트
- [x] Vercel 배포 테스트
- [x] CI/CD 파이프라인 업데이트
- [x] turbo run test/lint 전체 실행

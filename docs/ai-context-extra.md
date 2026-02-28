# LLM용 추가 컨텍스트

AI가 코드 제안/리팩터 시 참고하면 좋은 정보만 정리한 문서입니다.  
이 파일을 수정한 뒤 **`pnpm update:ai-context`** 를 실행하면 `docs/AI_CONTEXT.md`에 반영됩니다.

---

## 1. 코드 컨벤션 요약

- **Lint / Format**: Biome. `pnpm lint`, `pnpm format`, `pnpm format:check`. 수정 시 `pnpm lint:fix` 또는 `pnpm format`.
- **테스트**: Vitest 기본. `apps/travel`은 Playwright e2e도 사용 (`test:e2e:run`).
- **타입**: TypeScript strict. `pnpm typecheck`.
- **검증 일괄**: 코드 변경 후 반드시 루트에서 `pnpm ci:check`.
- **i18n 검증**: 메시지/타입 변경 시 `pnpm i18n:ci`.
- **API 에러 형식**: Route Handler는 `handleServiceError`를 사용하고 `ErrorResponseBody` 형태를 유지.

---

## 2. 기능별 코드 넣을 위치

| 하려는 일 | 넣을 위치 | 참고 |
| --- | --- | --- |
| 운영 웹 API 엔드포인트 | `apps/web/src/app/api/**/route.ts` | DB 접근은 `apps/web/src/services/**`만. Route Handler에서 `prisma` 직접 호출 금지. |
| 여행 앱 API 엔드포인트 | `apps/travel/src/app/api/**/route.ts` | `apps/web`와 동일 규칙: DB는 `apps/travel/src/services/**`만. |
| 웹 서비스(DB 사용) | `apps/web/src/services/*.service.ts` | Route Handler/Server Component는 서비스만 호출. |
| 여행 서비스(DB 사용) | `apps/travel/src/services/*.service.ts` | 대화/제휴/여행지/캐시 로직은 여기서 관리. |
| 여행 SEO/i18n 페이지 | `apps/travel/src/app/[locale]/**` | `middleware.ts`, `messages/*.json`, `services/destination.service.ts`와 함께 변경. |
| Agoda 관리자 테스트 패널 | `apps/web/src/app/admin/agoda/**` | 서버 호출은 `apps/web/src/app/api/admin/agoda/**` + `services/admin/agoda*.service.ts`. |
| Agoda CSV 처리 | `scripts/agoda-chunk-csv.mjs`, `scripts/agoda-import-csv.ts` | 대용량 처리이므로 Route Handler에 구현하지 말고 스크립트로 유지. |
| DB 모델/마이그레이션 | `packages/db/prisma/schema.prisma`, `packages/db/prisma/migrations/**` | `prisma db push` 금지, `pnpm db:migrate`만 사용. |
| 공용 에러/파서/포맷 | `packages/shared/src/errors`, `packages/shared/src/i18n`, `packages/shared/src/utils` | 순수 코드만 허용 (네트워크/DB/env 금지). |
| 워커 런타임/스케줄 | `packages/worker-shared/src/runtime/**`, `apps/worker/src/**` | 재사용 로직은 `worker-shared`로 올리고 엔트리는 `apps/worker`에 유지. |

---

## 3. 자주 하는 실수 / 피할 것

- Route Handler(`app/api/**/route.ts`)에서 `prisma` 또는 `@workspace/db` 직접 호출.
- Next.js 앱(`apps/web`, `apps/travel`)에서 `@workspace/worker-shared`를 직접 import.
- API 에러를 임의 JSON으로 반환해 `ErrorResponseBody` 계약을 깨뜨리는 변경.
- `packages/shared`에 `fetch`/`axios`/`process.env`/Node `fs` 등 런타임 의존 코드 추가.
- `packages/**/src/**` deep import 사용.
- 루트 `package.json`에 앱 런타임 의존성 추가.
- `prisma db push` 사용 (`pnpm db:migrate`만 허용).
- Agoda/내부 토큰을 URL query에 싣는 구현 (헤더 사용 + 비교는 timing-safe 방식 유지).
- i18n 메시지 변경 후 `pnpm i18n:ci`를 생략해 키 불일치 상태로 커밋.

---

## 4. 필수 명령어

```bash
# 로컬 실행
pnpm dev:web      # 운영 웹 (http://localhost:3000)
pnpm dev:travel   # 여행 앱 (http://localhost:3300)
pnpm dev:worker   # 워커

# 검증 (코드 변경 후·커밋 전 필수)
pnpm ci:check
pnpm i18n:ci

# 테스트
pnpm --filter @workspace/travel test:e2e:run

# DB
pnpm db:migrate
pnpm db:seed:base
pnpm db:studio
pnpm db:generate

# Agoda 데이터 처리 (대용량 CSV)
node scripts/agoda-chunk-csv.mjs <입력파일> --chunk-size 100000 --out-dir ~/Downloads/agoda-chunks
pnpm tsx scripts/agoda-import-csv.ts --dir ~/Downloads/agoda-chunks --batch 1000

# Docker (로컬 DB/Redis)
pnpm local:docker up -d db redis
```

---

## 5. 필요한 환경 변수 (이름만, 값 없음)

값은 `.env.example`, `apps/web/.env.example`, `apps/travel/.env.example`, `apps/worker/.env.example`를 기준으로 확인.

- **루트 공통**: `APP_ENV`, `DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`
- **웹 전용**: `NEXTAUTH_URL`, `WORKER_INTERNAL_URL`, `GOOGLE_FORM_WEBHOOK_SECRET`, `AGODA_AFFILIATE_SITE_ID`, `AGODA_AFFILIATE_API_KEY`, `AWIN_API_TOKEN`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- **트래블 전용**: `NEXTAUTH_URL`, `GOOGLE_GENERATIVE_AI_API_KEY`, `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`, `OPENWEATHERMAP_API_KEY`, `EXCHANGERATE_API_KEY`, `AWIN_API_TOKEN`, `AGODA_AFFILIATE_API_KEY`, `AGODA_AFFILIATE_SITE_ID`, `TRAVEL_INTERNAL_CRON_TOKEN`
- **워커 전용**: `WORKER_CONTROL_PORT`, `TRAVEL_INTERNAL_URL`, `TRAVEL_CACHE_PREWARM_CRON`, `TRAVEL_CACHE_PREWARM_TIMEOUT_MS`, `AFFILIATE_AUDIT_*`
- **Sentry(web/travel 공통 패턴)**: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_SEND_DEFAULT_PII`, `NEXT_PUBLIC_SENTRY_SEND_DEFAULT_PII`

---

## 6. 의존성 추가 규칙

- **루트 `package.json`**: 도구만 (turbo, biome, typescript, vitest, dotenv-cli 등). 앱 런타임 의존성 금지.
- **운영 웹 런타임**: `apps/web/package.json`
- **여행 앱 런타임**: `apps/travel/package.json`
- **워커 런타임**: `apps/worker` 또는 `packages/worker-shared`
- **DB/Prisma**: `packages/db`
- **범용 공유**: `packages/shared` (순수/런타임 비의존만)

새 패키지 추가 시 기준: "어디서 실행되는 코드인가(웹/트래블/워커/DB/공용)"를 먼저 결정하고 그 워크스페이스에만 추가.

# LLM용 추가 컨텍스트

AI가 코드 제안·리팩터 시 참고하면 좋은 정보만 정리한 문서입니다.  
이 파일을 수정한 뒤 **`pnpm update:ai-context`** 를 실행하면 `docs/AI_CONTEXT.md`에 반영됩니다.

---

## 1. 코드 컨벤션 요약

- **Lint / Format**: Biome. `pnpm lint`, `pnpm format`, `pnpm format:check`. 수정 시 `pnpm lint:fix` 또는 `pnpm format` 사용.
- **테스트**: Vitest. 테스트 파일은 `*.test.ts` / `*.test.tsx`, co-located(소스와 같은 디렉터리) 또는 패키지별 `vitest.config` 기준.
- **타입**: TypeScript strict. `pnpm typecheck`로 검증.
- **검증 일괄**: 코드 변경 후 반드시 루트에서 `pnpm ci:check` (lint + typecheck + test + build + format:check).

---

## 2. 기능별 코드 넣을 위치

| 하려는 일 | 넣을 위치 | 참고 |
| --- | --- | --- |
| 새 API 엔드포인트 | `apps/web/src/app/api/**/route.ts` | DB 접근은 `apps/web/src/services/**`에만. Route Handler에서 `prisma` 직접 호출 금지. |
| 새 서비스(DB 사용) | `apps/web/src/services/*.service.ts` | Route Handler / Server Component는 여기만 호출. |
| 새 페이지(인증 필요) | `apps/web/src/app/(app)/**/page.tsx` | `_components/`, `_lib/` co-located 허용. |
| 새 관리자 페이지 | `apps/web/src/app/admin/**/page.tsx` | 관리자 전용. |
| 새 워커 잡 정의 | `packages/worker-shared` → `jobs` | 실행은 `runtime`이 담당. `jobs`에서 DB/env 직접 접근 금지. |
| 워커 실행/스케줄 변경 | `packages/worker-shared/src/runtime/**` 또는 DB 시스템 설정 | env는 `runtime/settings/**`만. |
| 공용 타입/순수 유틸 | `packages/shared` | 네트워크/DB/Node built-in/process.env 금지. |
| 웹·워커 공용 상수/매핑 | `packages/shared` (순수만) | `packages/worker-shared`는 웹에서 import 금지. |

---

## 3. 자주 하는 실수 / 피할 것

- Route Handler(`app/api/**/route.ts`)에서 `prisma` 또는 `@workspace/db` 직접 호출 → 반드시 `services/**` 경유.
- `apps/web` 어디서든 `@workspace/worker-shared` import → 금지.
- `packages/shared`에 `fetch`/`axios`/`process.env`/Node `fs` 등 → 금지. 순수 함수·타입만.
- `packages/**/src/**` deep import → 금지. 패키지 `exports` 진입점만 사용.
- 루트 `package.json`에 런타임 의존성 추가 → 금지. 웹은 `apps/web`, 워커는 `apps/worker` 또는 `packages/worker-shared`, DB는 `packages/db`.
- `prisma db push` 사용 → 금지. `pnpm db:migrate`만 사용.
- 루프 안에서 `prisma.*` 쿼리 → 금지. 쿼리는 `select` 명시, 배치/트랜잭션 고려.

---

## 4. 필수 명령어

```bash
# 로컬 실행
pnpm dev:web      # 웹 (http://localhost:3000)
pnpm dev:worker   # 워커 (별도 터미널, REDIS_URL 필요)

# 검증 (코드 변경 후·커밋 전 필수)
pnpm ci:check

# DB
pnpm db:migrate   # 마이그레이션 적용
pnpm db:studio    # Prisma Studio
pnpm db:generate  # Prisma Client 재생성

# Docker (로컬 DB/Redis)
pnpm local:docker up -d db redis
```

---

## 5. 필요한 환경 변수 (이름만, 값 없음)

로컬/배포 시 채워야 하는 주요 변수만 나열합니다. 값은 `.env.example`, `apps/web/.env.example` 참고.

- **공통**: `APP_ENV`, `DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- **인증/알림**: `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (웹은 `apps/web/.env.local`)
- **워커·웹 연동**: `WORKER_CONTROL_PORT`, `WORKER_INTERNAL_URL`
- **모니터링(선택)**: `HEARTBEAT_*`, `MAX_PROCESSING_TIME_MS`, `WORKER_*_THRESHOLD_MS` 등

---

## 6. 의존성 추가 규칙

- **루트 `package.json`**: 도구만 (turbo, biome, typescript, vitest 등). 런타임 라이브러리 금지.
- **웹**: `apps/web/package.json`
- **워커**: `apps/worker` 또는 `packages/worker-shared`
- **DB**: `packages/db` (Prisma 등)
- **범용 공유**: `packages/shared` (순수·런타임 비의존만)

새 패키지 추가 시 “이 코드가 어디서 실행되는가(웹/워커/공용)”에 따라 위 위치에만 추가합니다.

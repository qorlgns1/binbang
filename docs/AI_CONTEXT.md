# AI 대화용 프로젝트 컨텍스트

> **사용법**: ChatGPT, Gemini, Grok 등에 새 대화를 시작할 때 이 파일 내용 전체를 **첫 메시지에 붙여넣거나** 프로젝트/컨텍스트 입력란에 붙여넣으세요.  
> **원본 문서**(`architecture.md`, `ai-context-extra.md`, `brand-identity.md`)를 수정했다면 `pnpm update:ai-context` 실행 후 다시 복사하세요. 컨텍스트 길이 제한이 있으면 일부 섹션을 지우고 붙여넣어도 됩니다.

---

## 프로젝트 한 줄 요약

**binbang** — Airbnb · Agoda 빈방 모니터링 & 카카오톡 알림 서비스. 인기 숙소의 취소 건을 잡기 위해 예약 가능 여부를 주기적으로 체크하고, 빈방이 나면 즉시 알림을 보냅니다.

---

## 내가 하는 일 / 이 프로젝트에서의 역할

<!-- 아래 문단을 본인 상황에 맞게 수정하세요. -->
- Full-stack 개발: 아키텍처, 웹(Next.js), 백그라운드 워커, DB 모델링, CI/CD, 운영까지 전담
- 이 저장소는 제가 운영하는 개인/팀 프로젝트이며, 규칙(rules.md) 기반 모노레포로 유지보수성과 경계를 강하게 유지하고 있습니다

---

## 지금 하고 있는 일 (선택)

너는 20년차 사업가야.
나는 신규 서비스를 출시하고, 유저들의 유입을 바라고 있어.
돈이 안드는 방법들을 최대한 사용해보려고해.
뭐부터 하면 좋을까?

---

## 프로젝트 구조 (모노레포)

```
apps/
  web/            # Next.js (UI + Server Components + Route Handlers)
  worker/         # 워커 엔트리포인트 + wiring만 (로직은 packages 쪽으로)

packages/
  db/             # Prisma 스키마, 마이그레이션, DB 클라이언트 (단일 소유)
  shared/         # 범용 공유 코드 (순수, 런타임 비의존)
  worker-shared/  # 워커 전용 (runtime / jobs / browser / observability)
```

- **웹**: `apps/web` — Route Handler는 DB 직접 접근 금지, 반드시 `apps/web/src/services/**` 경유
- **워커**: `apps/worker` — 엔트리포인트만 두고, 실제 로직은 `@workspace/worker-shared`의 public 진입점만 사용 (`/browser`, `/jobs`, `/runtime`, `/observability`)
- **DB**: `packages/db`만 Prisma 소유. 다른 패키지는 `import { prisma } from "@workspace/db"` 만 허용
- **공유**: `packages/shared`는 순수 코드만(네트워크/DB/Node 내장/process.env 금지). `packages/worker-shared`는 웹에서 import 금지

---

## 아키텍처 / 경계 원칙

<!-- INJECT: docs/architecture/architecture.md -->
# Architecture

## 1. 문서 역할

이 문서는 저장소의 **현재 구조 + 경계 정책 + 워크스페이스 책임**을 빠르게 파악하기 위한 기준 문서다.

우선순위:

1. `rules.md` (강제 규칙)
2. `RULES_SUMMARY.md` (요약)
3. `docs/architecture/architecture.md` (현재 구조와 경계 설명)
4. `docs/architecture/monorepo-plan.md` (마이그레이션 상태/계획)

---

## 2. 최근 변경에서 확인된 구조 변화

핵심 변화 축:

- `apps/travel`이 실질적인 2번째 Next.js 앱으로 자리잡음 (SEO/i18n/GA/캐시/에러 UX)
- 에러 처리 표준화: `@workspace/shared/errors` + `ErrorResponseBody` 중심으로 웹/트래블 통일
- 관측(Observability) 강화: `apps/web`, `apps/travel` 모두 Sentry 런타임/소스맵 설정 반영
- 데이터 모델 확장: `Destination`, `AgodaHotel` + 검색 인덱스/CSV 스트리밍 임포트 파이프라인 추가
- CI/배포/툴링 정리: pnpm 10.30.2, deploy workflow 옵션 정리, Codex 다중 에이전트 리뷰 플로우 도입

최근 변경 유형 분포(머지 제외):

- `fix` 24
- `refactor` 20
- `feat` 14
- `chore` 13
- `docs/test/style/perf/ci` 6

---

## 3. 모노레포 구조 (현재)

```text
binbang/
├── .github/
│   └── workflows/
├── apps/
│   ├── web/                        # Next.js 관리/운영 앱
│   ├── travel/                     # Next.js 여행 AI + SEO/i18n 앱
│   └── worker/                     # Worker entrypoint + composition
├── packages/
│   ├── db/                         # Prisma schema/migrations + DB client
│   ├── shared/                     # Universal shared code (pure)
│   └── worker-shared/              # Worker-only shared code
├── docker/
├── docs/
├── rules.md
├── RULES_SUMMARY.md
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## 4. 워크스페이스 책임과 공개 API

| Workspace | 역할 | 공개 import 경로 | 핵심 경계 |
| --- | --- | --- | --- |
| `apps/web` | 운영 UI + App Router + Route Handler | 앱 내부 로컬 import | DB는 `apps/web/src/services/**`로만 접근, Route Handler 직접 DB 접근 금지 |
| `apps/travel` | 여행 AI UI + Locale 라우팅 + SEO 페이지 + 제휴 이벤트 | 앱 내부 로컬 import | `apps/web`와 동일 레이어 규칙: DB는 `apps/travel/src/services/**`로만 접근 |
| `apps/worker` | 프로세스 엔트리/조립(wiring) + 크론성 실행 | 앱 내부 로컬 import | 재사용 가능한 워커 로직은 `packages/worker-shared`로 승격 |
| `packages/db` | Prisma 단일 소유자 | `@workspace/db`, `@workspace/db/client`, `@workspace/db/enums` | 외부에서 `@prisma/client` 직접 import 금지 |
| `packages/shared` | 웹/트래블/워커 공용 순수 코드 | `@workspace/shared`, `@workspace/shared/types`, `@workspace/shared/checkers`, `@workspace/shared/url-parser`, `@workspace/shared/urlParser`, `@workspace/shared/i18n`, `@workspace/shared/utils/date`, `@workspace/shared/utils/timeout`, `@workspace/shared/utils/price`, `@workspace/shared/errors` | 네트워크/DB/Node built-in/process.env 금지 |
| `packages/worker-shared` | 워커 전용 공용 로직 | `@workspace/worker-shared/browser`, `@workspace/worker-shared/jobs`, `@workspace/worker-shared/runtime`, `@workspace/worker-shared/observability` | Next.js 앱(`web`/`travel`)에서 import 금지, deep import 금지 |

---

## 5. 디렉터리 구조 상세

### 5.1 `apps/web`

```text
apps/web/src/
├── app/                            # App Router (public/app/admin/api)
├── components/
├── features/
├── hooks/
├── i18n/
├── lib/
├── services/                       # DB 접근 단일 게이트
└── types/
```

규칙:

- Route Handler(`app/api/**/route.ts`)는 DB 직접 접근 금지
- DB가 필요한 경우 `services/**`로 위임
- API 에러 응답은 `handleServiceError` + `ErrorResponseBody` 형식 유지

### 5.2 `apps/travel`

```text
apps/travel/src/
├── app/                            # [locale] 라우트 + API 라우트
├── components/
├── hooks/
├── lib/                            # AI/tool/cache/api 유틸
├── services/                       # DB 접근 단일 게이트
├── stores/                         # Zustand client state
├── scripts/                        # 여행지 콘텐츠 생성 등
└── types/
```

규칙:

- `apps/web`와 동일하게 Route Handler의 DB 직접 접근 금지
- locale 라우팅/middleware 변경 시 `/monitoring` 경로 제외 규칙 유지
- SEO/여행지 데이터는 `Destination` 모델 + `services/destination.service.ts`를 기준으로 관리

### 5.3 `apps/worker`

현재 주요 파일:

```text
apps/worker/src/
├── main.ts
├── config.ts
├── cycleProcessor.ts
├── checkProcessor.ts
└── publicAvailabilitySnapshotOnce.ts
```

원칙:

- 엔트리/조립 책임 중심
- 런타임/브라우저/잡/관측의 재사용 로직은 `packages/worker-shared`로 수렴

### 5.4 `packages/db`

```text
packages/db/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   ├── constants/
│   └── seed*.ts
└── src/
    ├── client.ts
    ├── enums.ts
    └── index.ts
```

최근 확장 포인트:

- `Destination` 모델 + seed-base 데이터 추가 (SEO/i18n 페이지용)
- `AgodaHotel` 모델 + 검색 인덱스 추가 (대용량 CSV 임포트/검색용)

### 5.5 `packages/shared`

```text
packages/shared/src/
├── index.ts
├── types/
├── checkers/
├── errors/                         # AppError/ApiError/ErrorResponseBody
├── i18n/                           # locale resolve + formatter + i18n core
├── utils/
├── urlParser.ts
└── urlBuilder.ts
```

원칙:

- 순수 유틸/타입/파서/에러 계약만 배치
- 네트워크 I/O, DB 접근, Node built-in, `process.env` 접근 금지

### 5.6 `packages/worker-shared`

```text
packages/worker-shared/src/
├── browser/
├── jobs/
├── runtime/
│   ├── i18n/
│   ├── selectors/
│   └── settings/
└── observability/
```

도메인 역할:

- `browser`: 브라우저 자동화 실행
- `jobs`: 작업 단위와 payload 정의
- `runtime`: 큐/스케줄링/재시도/동시성/설정/오케스트레이션
- `observability`: 로깅/메트릭/알림/에러 정규화

경계:

- DB 접근은 `runtime/**` 중심으로 제한
- env 접근은 `runtime/settings/**` 중심으로 제한
- 소비자는 `exports` 경로만 사용 (`src/**` deep import 금지)

---

## 6. Import 경계 체크리스트

- deep import 금지: `packages/**/src/**`
- Next.js 앱(`apps/web`, `apps/travel`)에서 `@workspace/worker-shared/*` import 금지
- `packages/shared` -> DB/worker runtime 의존 금지
- Prisma 직접 import(`@prisma/client`)는 `packages/db` 외부 금지
- `apps/web` DB 접근은 `apps/web/src/services/**`로 단일화
- `apps/travel` DB 접근은 `apps/travel/src/services/**`로 단일화
- Route Handler 에러 응답은 `ErrorResponseBody` 스키마 유지

---

## 7. 빠른 점검 명령

```bash
# 구조 확인
find apps packages -maxdepth 3 -type d | sort

# 워크스페이스 import 확인
rg -n "from '@workspace/" apps packages

# Route Handler 직접 DB 접근 위반 점검 (web + travel)
rg -n "prisma\\.|from '@workspace/db'" apps/web/src/app/api apps/travel/src/app/api

# services 레이어 DB 접근 현황 점검
rg -n "prisma\\.|from '@workspace/db'" apps/web/src/services apps/travel/src/services

# deep import 위반 점검
rg -n "@workspace/(shared|worker-shared|db)/src" apps packages

# 최근 확장 모델 점검
rg -n "model (Destination|AgodaHotel)" packages/db/prisma/schema.prisma
```
<!-- END INJECT -->

---

## 브랜드 정체성 (빈방)

<!-- INJECT: docs/history/branding/brand-identity.md -->
# Brand Identity Guide: 빈방

## 1. 브랜드 개요 (Brand Overview)

- **브랜드 이름**: 빈방
- **슬로건**: 당신의 휴식이 길을 잃지 않도록, 빈방
- **핵심 가치 (Core Value)**: 안도감, 신뢰, 정교함
- **브랜드 상징 (Archetype)**: 어두운 밤바다에서 길을 비추는 **'등대'**

## 2. 브랜드 페르소나 (Persona)

- **성격**: 다정하고 차분한 조력자
- **태도**: 기술적인 복잡함은 뒤로 숨기고, 사용자에게는 오직 정돈된 결과와 평온함만을 전달함
- **목소리 톤 (Tone of Voice)**:
  - 차분하고 격려하는 말투 (A-Type)
  - 신뢰감을 주는 전문적인 용어와 따뜻한 일상 언어의 조화

## 3. 핵심 기술의 브랜드 언어화 (Value Proposition)

| 기술적 자산 (Tech Assets)  | 사용자 가치 (User Benefit)       | 브랜드 메시지                         |
| :------------------------- | :------------------------------- | :------------------------------------ |
| **브라우저 풀링 시스템**   | 압도적인 체크 속도 (70% 단축)    | "누구보다 빨리 전하는 가장 밝은 소식" |
| **동적 셀렉터 관리**       | 플랫폼 변화에도 끊김 없는 정확도 | "어떤 풍랑에도 흔들림 없는 정교함"    |
| **워커 하트비트 & 로그**   | 24시간 중단 없는 모니터링        | "잠든 사이에도 당신을 지키는 성실함"  |
| **TanStack Query 기반 UX** | 부드럽고 매끄러운 사용 경험      | "기다림조차 편안함이 되는 배려"       |

## 4. 랜딩 페이지 카피라이팅 (Copywriting)

### 메인 카피

> **당신의 휴식이 길을 잃지 않도록,**
> **빈방이 밤새 불을 밝혀둘게요.**

### 상세 설명

- **안심하세요**: 1분 단위로 스스로를 점검하는 하트비트 시스템이 당신의 기다림을 안전하게 지킵니다.
- **빠릅니다**: 브라우저 최적화 기술로 남들보다 한 걸음 먼저 빈자리를 찾아냅니다.
- **정확합니다**: 사이트가 바뀌어도 코드 수정 없이 대응하는 기술로 단 하나의 기회도 놓치지 않습니다.

## 5. 비주얼 가이드 (Visual Identity)

- **메인 컬러**: Deep Navy (#001F3F 계열) - 밤바다의 정적과 신뢰감
- **포인트 컬러**: Amber Gold (#FFBF00 계열) - 따뜻한 등대의 불빛과 희망
- **디자인 원칙**:
  - 날카로운 직선보다는 부드러운 곡선 사용
  - 여백을 충분히 활용하여 사용자의 시각적 피로도 최소화
<!-- END INJECT -->

---

## 코드 컨벤션·위치·피할 것·명령어 (LLM용)

<!-- INJECT: docs/ai-context-extra.md -->
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
- **웹 전용**: `NEXTAUTH_URL`, `WORKER_INTERNAL_URL`, `GOOGLE_FORM_WEBHOOK_SECRET`, `AGODA_API_KEY`, `AWIN_API_TOKEN`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`
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
<!-- END INJECT -->

---

## 기술 스택 & 주요 기능

- **스택**: Node 24+, TypeScript 5.7, Next.js 15, Tailwind v4, Prisma, BullMQ(Redis), Playwright, NextAuth
- **기능**: 카카오/구글 로그인, 멀티 유저, 숙소 CRUD, 30분 주기 자동 모니터링, 카카오톡 알림, 체크 로그, 브라우저 풀, 관리자 설정/감사 로그, 하트비트·워커 재시작, 처리량 대시보드, API Rate Limiting, DB 기반 동적 셀렉터, shadcn/ui

---

## 이 저장소에서 꼭 지켜야 할 것 (요약)

- **규칙 문서**: 모든 구현/리팩터/리뷰는 `rules.md`와 `RULES_SUMMARY.md`를 따름. 충돌 시 `rules.md` 우선.
- **경계**: 패키지 `exports`로만 import. deep import (`packages/**/src/**`) 금지.
- **DB**: Route Handler는 `prisma` 직접 호출 금지 → `services/**`만 사용. 쿼리는 `select` 명시, 루프 내 쿼리 금지.
- **검증**: 코드 변경 후 반드시 루트에서 `pnpm ci:check` 실행 후 완료. 커밋/푸시 전에도 동일.

---

## 버전 및 최종 갱신

- **프로젝트 버전**: 2.18.0
- **이 문서 최종 갱신**: 2026-02-10

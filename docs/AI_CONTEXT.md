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

> 이 문서 수정 후 **`pnpm update:ai-context`** 실행 시 AI 컨텍스트에 반영됩니다.  
> Last updated: 2026-02-10

## 1. 문서 역할

이 문서는 현재 저장소의 **구조 + 경계 정책 + 워크스페이스 책임**을 한 번에 설명하는 기준 문서다.

우선순위:

1. `rules.md` (강제 규칙)
2. `RULES_SUMMARY.md` (요약)
3. `docs/architecture/architecture.md` (현재 구조와 경계 설명)
4. `docs/architecture/monorepo-plan.md` (마이그레이션 상태/계획)

---

## 2. 모노레포 구조 (현재)

```text
binbang/
├── .github/
│   └── workflows/
├── apps/
│   ├── web/                        # Next.js (UI + Route Handlers)
│   └── worker/                     # Worker entrypoint + composition
├── packages/
│   ├── db/                         # Prisma schema/migrations + DB client
│   ├── shared/                     # Universal shared code
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

## 3. 워크스페이스 책임과 공개 API

| Workspace | 역할 | 공개 import 경로 | 핵심 경계 |
| --- | --- | --- | --- |
| `apps/web` | UI + App Router + Route Handler | 앱 내부 로컬 import | DB는 `services/**`로만 접근, `@workspace/worker-shared/*` import 금지 |
| `apps/worker` | 프로세스 엔트리/조립(wiring) | 앱 내부 로컬 import | 재사용 워커 로직은 `packages/worker-shared`로 승격 |
| `packages/db` | Prisma 단일 소유자 | `@workspace/db`, `@workspace/db/client`, `@workspace/db/enums` | 외부의 `@prisma/client` 직접 import 금지 |
| `packages/shared` | 웹/워커 공용 순수 코드 | `@workspace/shared`, `@workspace/shared/types`, `@workspace/shared/checkers`, `@workspace/shared/url-parser` | 네트워크/DB/Node built-in/process.env 금지 |
| `packages/worker-shared` | 워커 전용 공용 로직 | `@workspace/worker-shared/browser`, `@workspace/worker-shared/jobs`, `@workspace/worker-shared/runtime`, `@workspace/worker-shared/observability` | 웹에서 import 금지, deep import 금지 |

---

## 4. 디렉터리 구조 상세

### 4.1 `apps/web`

```text
apps/web/src/
├── app/                            # App Router (public/app/admin/api 포함)
├── components/                     # UI 및 화면 컴포넌트
├── features/                       # React Query 훅/뮤테이션
├── hooks/
├── lib/                            # 웹 전용 유틸/설정
├── services/                       # DB 접근 단일 게이트
└── types/
```

규칙:

- Route Handler(`app/api/**/route.ts`)는 DB 직접 접근 금지
- Server Component/Server Action도 DB 직접 접근 금지
- DB가 필요한 경우 `apps/web/src/services/**`로 위임
- Client Component는 서버 전용 모듈/DB 접근 금지

### 4.2 `apps/worker`

현재 주요 파일:

```text
apps/worker/src/
├── main.ts
├── config.ts
├── cycleProcessor.ts
├── checkProcessor.ts
└── statusUtils.ts
```

원칙:

- 장기적으로 엔트리/조립만 남기고 재사용 가능한 워커 로직은 `packages/worker-shared`로 이동
- 런타임/브라우저/잡/관측 책임은 `worker-shared` 4개 도메인으로 수렴

### 4.3 `packages/db`

```text
packages/db/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed*.ts
└── src/
    ├── client.ts
    ├── enums.ts
    └── index.ts
```

원칙:

- Prisma 스키마/마이그레이션/클라이언트 생성 책임 단일 소유
- 앱/패키지는 `@workspace/db` 공개 엔트리만 사용

### 4.4 `packages/shared`

```text
packages/shared/src/
├── index.ts
├── types/
├── checkers/
├── url-parser.ts
└── url-builder.ts
```

원칙:

- 순수 유틸/타입/파서만 배치
- 네트워크 I/O, DB 접근, Node built-in, `process.env` 접근 금지

### 4.5 `packages/worker-shared`

```text
packages/worker-shared/src/
├── browser/
├── jobs/
├── runtime/
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
- 도메인 소비자는 `exports` 경로만 사용 (`src/**` deep import 금지)

---

## 5. Import 경계 체크리스트

- deep import 금지: `packages/**/src/**`
- `apps/web` -> `@workspace/worker-shared/*` 금지
- `packages/shared` -> DB/worker runtime 의존 금지
- Prisma 직접 import(`@prisma/client`)는 `packages/db` 외부 금지
- `apps/web` DB 접근은 `services/**`로 단일화

---

## 6. 빠른 점검 명령

```bash
# 구조 확인
find apps packages -maxdepth 3 -type d | sort

# 워크스페이스 import 확인
rg -n "from '@workspace/" apps packages

# web DB 접근 위치 점검
rg -n "prisma\\.|from '@workspace/db'" apps/web/src/app apps/web/src/services

# worker-shared deep import 위반 점검
rg -n "@workspace/worker-shared/src" apps packages
```
<!-- END INJECT -->

---

## 브랜드 정체성 (빈방)

<!-- INJECT: docs/history/branding/brand-identity.md -->
# Brand Identity Guide: 빈방

> 이 문서 수정 후 **`pnpm update:ai-context`** 실행 시 AI 컨텍스트에 반영됩니다.

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

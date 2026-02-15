# RULES.md (모노레포 – 강제 규칙)

## 0. 핵심 원칙 (Core Principles)

- 이 저장소는 **엄격한 경계(strict boundaries)**를 가진 모노레포이다.
- 경계는 관례가 아니라 **패키지 소유권(package ownership)**과 **공개 API(public APIs)**로 강제된다.
- 이 규칙을 위반하면 향후 마이그레이션 및 유지보수 비용이 증가하며, **모든 위반은 금지된다**.
- 본 문서에서 사용되는 키워드는 다음 의미를 가진다:
  - **MUST / MUST NOT**: 절대적 규칙 (협상 불가)
  - **MAY**: 허용되지만 필수는 아님
  - **SHOULD / SHOULD NOT**: 강력 권고 (명시적 사유 없이는 따라야 함)

---

## MONOREPO_PLAN과의 관계

이 문서는 `MONOREPO_PLAN.md`에 정의된 구조와 결정 사항을 기반으로 한 **강제 규칙(enforced rules)**을 정의한다.

- `MONOREPO_PLAN.md`는 **의도된 아키텍처와 마이그레이션 계획**을 설명한다.
- `rules.md`는 **마이그레이션 전·후에 반드시 지켜야 하는 비협상 규칙**을 정의한다.

충돌 시:

- 구현과 코드 리뷰에서는 **rules.md가 항상 우선한다**.
- 아키텍처 의도가 바뀌면 `MONOREPO_PLAN.md`를 반드시 갱신해야 한다.

---

## 1. 모노레포 구조 (권위 있는 구조)

```
apps/
  web/            # Next.js (UI + Server Components + Route Handlers)
  worker/         # 워커 엔트리포인트 + wiring만 담당 (로직 금지)

packages/
  db/             # Prisma 스키마, 마이그레이션, DB 클라이언트 (단일 소유자)
  shared/         # 범용 공유 코드 (순수, 런타임 비의존)
  worker-shared/  # 워커 전용 공유 코드 (runtime / jobs / browser / observability)
```


- 새로운 최상위 디렉터리는 명시적 승인 없이는 **생성 금지**.
- 코드 소유권은 편의가 아니라 **패키지 단위**로 정의된다.

---

## 2. 패키지 공개 API 규칙

### 2.1 Deep Import 금지

- `packages/**/src/**` 또는 내부 파일로의 직접 import는 **금지**.
- 반드시 패키지 `exports`에 정의된 공개 진입점만 사용해야 한다.

**예시**
- ✅ `import { foo } from "@workspace/shared"`
- ❌ `import { foo } from "@workspace/shared/src/foo"`
- ✅ `import { runtimeX } from "@workspace/worker-shared/runtime"`
- ❌ `import { runtimeX } from "@workspace/worker-shared/src/runtime/x"`

---

## 3. Shared 코드 경계

### 3.1 `@workspace/shared` (범용, universal)

**목적**  
웹과 워커 어디서든 안전하게 사용할 수 있는 **순수 코드**만 포함한다.

**허용 (이것만 가능)**

- 타입, 인터페이스, DTO
- 부작용 없는 순수 유틸리티
- 상수, 매핑
- 파싱 / 포맷 유틸
- 에러 타입 및 에러 코드
- `Date`, `Intl` 사용

**금지 (MUST NOT)**

- 네트워크 I/O (`fetch`, `axios` 등)
- DB 접근 또는 Prisma 사용 (`@workspace/db` 포함)
- Node 내장 모듈 (`fs`, `path`, `child_process` 등)
- 런타임 제어용 타이머/스케줄링(cron, queue 등)
- 브라우저 자동화 라이브러리 (Playwright, Puppeteer)
- `process.env` 직접 접근 (`dotenv` 포함)
- 워커 런타임 라이브러리 (BullMQ, Redis 클라이언트 등)

`@workspace/shared`는 반드시 **순수(pure)**하고 **런타임 독립적(runtime-agnostic)**이어야 한다.

---

### 3.2 `@workspace/worker-shared` (워커 전용)

**목적**  
워커 전용 공유 코드. Node 전용 코드 사용 가능.

**허용**

- Node 전용 코드
- 브라우저 자동화, 큐/크론/잡 유틸
- DB 접근 (아래 제약 조건 하에서만)
- 관측성(observability) 유틸

**금지**

- `apps/web/**`는 어떤 맥락에서도 `@workspace/worker-shared`를 import해서는 안 된다.
- React / Next.js / UI 프레임워크 의존 금지

---

## 4. Worker-Shared 구조와 경계

`@workspace/worker-shared`는 다음 **4개 카테고리만 공개 API로 제공**한다:

- `@workspace/worker-shared/browser`
- `@workspace/worker-shared/jobs`
- `@workspace/worker-shared/runtime`
- `@workspace/worker-shared/observability`

**규칙**
- 공개 카테고리의 추가/병합/이름 변경은 금지
- 내부 구조는 변경 가능하나, 공개 진입점은 안정적으로 유지해야 한다
- 위 서브패스 외의 import는 금지

---

### 4.1 `browser/`

- 브라우저 자동화 **실행 전용**
- 스케줄링, 재시도, 큐, 런타임 제어 금지
- 실행 환경을 알면 안 됨

**DB / Env**
- DB 직접/간접 접근 금지
- `process.env` 접근 금지

---

### 4.2 `jobs/`

- “무슨 일을 할지”만 정의
- 브라우저 직접 제어 금지
- 큐/크론 직접 사용 금지
- 실행은 반드시 `runtime`에 위임

**DB / Env**
- DB 접근 금지
- env 접근 금지

---

### 4.3 `runtime/`

- 실행 전략과 환경 제어의 단일 소유자
- 큐, 스케줄링, 재시도, 백오프, 동시성 제어 허용
- 비즈니스 로직 / 브라우저 로직 금지

**DB 규칙**
- DB 접근은 `runtime/**`에서만 허용
- 워커 전체에서 DB 접근의 단일 진입점

**Env 규칙**
- 환경 변수 접근은 `runtime/settings/**`에서만 허용
- 설정 로딩, 검증, 기본값 관리는 이곳에서만 수행

---

### 4.4 `observability/`

- 로그, 메트릭, 트레이싱, 에러 정규화 담당
- 제어 흐름 변경 금지
- 전역 부작용 금지

---

## 5. Prisma / DB 규칙 (`@workspace/db`)

- Prisma 스키마/마이그레이션은 `packages/db`만 소유
- `@prisma/client` 외부 import 금지
- `apps/web`의 DB 접근은 `apps/web/src/services/**`에서만 허용 (Single Gate)
- Web Client Component에서 DB 접근 금지
- Web Server Component / Server Action은 DB 직접 접근 금지 (`services/**` 경유 필수)
- Route Handler는 `prisma.*` 직접 호출 금지, DB 작업은 `apps/web/src/services/**`로 위임
- `apps/web/src/app/api/**` Route Handler는 DB 직접 접근 금지
  - 금지 예: `@workspace/db` 직접 import, Prisma 직접 호출, SQL 직접 실행
- Route Handler는 DB 접근이 필요할 때 `apps/web/src/services/**`를 통해서만 접근 가능
- Route Handler는 `services/**` 밖의 DB 접근 모듈 호출 금지
- Worker DB 접근은 `worker-shared/runtime` 경유 권장

---

## 9. Generated 산출물 규칙

- `generated/**`, `dist/**`는 **산출물**
- 커밋 금지
- 공용 타입의 원천으로 사용 금지

---

## 10. LLM 작업 완료 규칙

- LLM이 코드 변경 작업을 완료했다고 보고하기 전에
  **반드시 `pnpm ci:check`를 실행해야 한다**
- 실패 시 작업 완료로 간주하지 않는다

---

## 11. 커밋 / 푸시 전 검증 규칙

- 모든 커밋 또는 푸시 전에 `pnpm ci:check` 실행은 **필수**
- 실행되지 않았거나 실패한 상태의 커밋/푸시는 **규칙 위반**

---

## 12. 네이밍 규칙 (강제)

### 12.0 적용 범위

- 이 네이밍 규칙은 **신규 생성 파일/폴더**와 **명시적 리네임 작업**에 적용된다.
- 기존 레거시 이름은 스코프가 명확한 리팩터 티켓으로 점진적으로 마이그레이션할 수 있다.
- 범위 정의 없이 전역 대량 리네임을 수행하는 것은 금지한다.

### 12.1 파일 네이밍

- React 컴포넌트 파일(`.tsx`)은 `PascalCase`를 사용해야 한다.
  - 예: `AdminSidebar.tsx`, `DateFilter.tsx`
- 비컴포넌트 소스 파일(`.ts` / 유틸 `.tsx`)은 `camelCase`를 사용해야 한다.
  - 예: `useFunnelQuery.ts`, `landingEventRetention.ts`, `dateFilter.test.ts`

### 12.2 폴더 네이밍

- 폴더는 `kebab-case`를 사용해야 한다.
  - 예: `admin-funnel`, `landing-events`

### 12.3 Next App Router private 폴더

- `apps/web/src/app/**`에서 라우트 세그먼트가 아닌 구현 상세 폴더는 반드시 언더스코어(`_`) 프리픽스를 사용해야 한다.
  - 예: `_components`, `_hooks`, `_lib`
- `_` 뒤 이름은 해당 라우트 하위 트리 내에서 일관성을 유지해야 한다.

### 12.4 필수 예외

- Next.js 예약 파일명은 그대로 유지해야 한다.
  - `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `template.tsx`, `default.tsx`
- 테스트/스냅샷 관례 폴더는 예외로 허용한다.
  - `__tests__`, `__snapshots__`
- locale 폴더는 BCP-47 스타일을 허용한다.
  - 예: `ko`, `en`, `ja`, `zh-CN`
- `packages/db/prisma/migrations/**` 하위 마이그레이션 디렉터리는 불변 자산으로 간주하며 폴더 네이밍 규칙 예외다.
- 외부 도구/계약 파일명은 통합 요구사항이 있으면 원형을 유지할 수 있다.
  - 예: `next-auth.d.ts`
- `apps/web/src/components/ui/**`는 shadcn 호환을 위해 kebab-case 컴포넌트 파일명을 허용한다.
- `apps/web/src/services/**` 하위 서비스 레이어 파일은 kebab-case + `.service` 접미사를 사용해야 한다.
  - 예: `accommodations.service.ts`, `admin/funnel-clicks.service.ts`
- `apps/web/src/services/**` 하위 서비스 테스트 파일은 kebab-case + `.service.test` 접미사를 사용해야 한다.
  - 예: `accommodations.service.test.ts`, `admin/__tests__/funnel-clicks.service.test.ts`

---

## 최종 목적

이 규칙의 목적은:
- 작은 인스턴스에서도 안정적인 런타임 유지
- 경계가 명확한 구조
- LLM과 사람이 모두 우회할 수 없는 규칙 집행
- 장기적으로 유지 가능한 모노레포 운영

이다.

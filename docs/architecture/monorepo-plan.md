# MONOREPO_PLAN.md

> Last updated: 2026-02-10

## 1. 목적

이 문서는 저장소의 모노레포 아키텍처 방향과 마이그레이션 진행 기준을 정의한다.

핵심 목표:

- 웹, 워커, 공유 코드, 데이터베이스의 소유권을 패키지 단위로 분리
- 공개 API 기반 경계(패키지 exports)로 결합도 관리
- 워커 런타임 변경 시 도메인 로직 재작성 비용 최소화
- 장기 유지보수 비용과 회귀 리스크 감소

이 문서는 "방향/순서/상태"를 다룬다.  
강제 규칙은 `rules.md`가 단독으로 담당한다.

---

## 2. `rules.md`와의 관계

- `monorepo-plan.md`: 아키텍처 의도, 단계, 진행 현황
- `rules.md`: 코드 리뷰/구현 시 강제되는 비가역 규칙

충돌 시 우선순위:

1. `rules.md`
2. `monorepo-plan.md`

아키텍처 의사결정이 변경되면 이 문서를 즉시 갱신한다.

---

## 3. 목표 아키텍처 (현재 기준)

### 3.1 Top-level 구조

```text
binbang/
├── apps/
│   ├── web/             # Next.js (UI + Server Components + Route Handlers)
│   └── worker/          # Worker entrypoint + composition/wiring
├── packages/
│   ├── db/              # Prisma schema/migrations + DB client
│   ├── shared/          # Universal shared code (runtime-agnostic)
│   └── worker-shared/   # Worker-only shared code
├── docker/
├── docs/
├── pnpm-workspace.yaml
├── turbo.json
└── rules.md
```

### 3.2 워크스페이스 책임

#### `apps/web`

- 사용자-facing 웹 애플리케이션
- App Router, Server Component, Route Handler 중심
- DB 접근은 `apps/web/src/services/**` 경유 원칙 준수

#### `apps/worker`

- 워커 프로세스 시작점과 wiring 책임
- 장기 목표: 엔트리/조립만 유지하고 재사용 로직은 `packages/worker-shared`로 이동

#### `packages/db` (`@workspace/db`)

- Prisma schema/migrations 단일 소유
- DB 클라이언트 단일 공개 지점 제공
- 외부 패키지의 `@prisma/client` 직접 import 금지

#### `packages/shared` (`@workspace/shared`)

- 웹/워커 공용 순수 코드
- 런타임 비의존 타입, 파서, 유틸 제공
- 네트워크/DB/Node built-in/process.env 접근 금지

#### `packages/worker-shared` (`@workspace/worker-shared/*`)

- 워커 전용 공용 로직
- 아래 4개 고정 도메인으로 구성:
  - `browser`
  - `jobs`
  - `runtime`
  - `observability`

---

## 4. Public API 정책 (최신 네이밍)

deep import는 금지하며, 패키지 `exports`로 노출된 진입점만 사용한다.

| 패키지 | 공개 import 경로 | 비고 |
| --- | --- | --- |
| `@workspace/db` | `@workspace/db`, `@workspace/db/client`, `@workspace/db/enums` | Prisma 단일 소유 |
| `@workspace/shared` | `@workspace/shared`, `@workspace/shared/types`, `@workspace/shared/checkers`, `@workspace/shared/url-parser` | 순수/런타임 중립 |
| `@workspace/worker-shared` | `@workspace/worker-shared/browser`, `@workspace/worker-shared/jobs`, `@workspace/worker-shared/runtime`, `@workspace/worker-shared/observability` | 워커 전용 |

예시:

- 허용: `import { prisma } from "@workspace/db"`
- 금지: `import { prisma } from "@workspace/db/src/client"`
- 허용: `import { createCycleQueue } from "@workspace/worker-shared/runtime"`
- 금지: `import { createCycleQueue } from "@workspace/worker-shared/src/runtime/queues"`

---

## 5. Worker 도메인 모델

| 도메인 | 책임 | 금지 |
| --- | --- | --- |
| `browser` | 브라우저 자동화 실행 | 스케줄링/큐/재시도 제어, DB/env 직접 접근 |
| `jobs` | 작업 단위 정의와 payload 모델 | 브라우저 직접 제어, 큐 라이브러리 직접 사용, DB/env 직접 접근 |
| `runtime` | 큐/스케줄링/재시도/동시성/설정/오케스트레이션 | 비즈니스 도메인 로직 과적재 |
| `observability` | 로깅/메트릭/에러 정규화 | 제어 흐름 결정, DB/env 직접 접근 |

추가 원칙:

- 워커 DB 접근은 `runtime/**`로 집중
- env 접근은 `runtime/settings/**`로 집중
- 웹(`apps/web`)은 `@workspace/worker-shared/*` import 금지

---

## 6. 마이그레이션 진행 현황 (2026-02-10 기준)

| 단계 | 상태 | 현재 반영 내용 | 남은 작업 |
| --- | --- | --- | --- |
| 1. Root workspace 기반 | DONE | `pnpm-workspace.yaml`, `turbo.json`, root scripts 정비 | 없음 |
| 2. DB 소유권 분리 | DONE | Prisma가 `packages/db`에 집중 | 없음 |
| 3. Shared 경계 분리 | DONE | `packages/shared` + `packages/worker-shared` 분리 완료 | 경계 lint 강화는 지속 |
| 4. Web workspace 분리 | DONE | `apps/web` 독립 빌드/타입체크 파이프라인 구성 | 없음 |
| 5. Worker 엔트리 단순화 | IN_PROGRESS | `apps/worker` + `packages/worker-shared` 공존 구조 적용 | `apps/worker`의 잔여 로직을 `worker-shared`로 추가 이관 |
| 6. 인프라 연동 | DONE | Redis/BullMQ/Playwright + Docker 구성 | 운영 파라미터 고도화는 별도 |
| 7. 품질 게이트 | DONE | `pnpm ci:check` + Turbo 태스크 기준 확립 | 규칙 위반 감시 자동화 보강 |
| 8. 레거시 구조 아카이브 | TODO | 코드 구조 전환은 완료 | 필요 시 별도 백업 브랜치/문서화 |

---

## 7. 남은 핵심 작업 (우선순위)

1. `apps/worker`를 엔트리/조립 전용으로 축소
2. `apps/worker/src/checkProcessor.ts`의 재사용 로직을 `packages/worker-shared` 도메인으로 이관
3. `apps/worker/src/cycleProcessor.ts`의 DB/큐 오케스트레이션을 `runtime` 중심으로 재배치
4. `apps/worker/src/statusUtils.ts` 성격을 재분류해 `jobs` 또는 `runtime`으로 이동
5. `apps/worker`의 DB 직접 의존을 최소화하고 `runtime` 경유 경계를 강화

---

## 8. 비목표 (Non-goals)

이 문서는 아래 항목을 결정하지 않는다.

- 특정 큐 벤더/브로커 교체 의사결정
- 특정 호스팅 벤더 종속 운영 전략
- 제품 UI/기능 우선순위
- 구조 경계와 무관한 미세 성능 튜닝

해당 의사결정은 별도 RFC/가이드 문서에서 다룬다.

---

## 9. 성공 기준

아래 조건을 만족하면 마이그레이션 완료로 본다.

- 패키지 경계가 import 경로와 exports 정책으로 강제된다.
- 웹/워커/공유/DB가 독립적으로 변경 및 배포 가능하다.
- 워커 런타임 전략 변경이 jobs/browser 도메인 재작성 없이 가능하다.
- `apps/worker`는 엔트리/조립만 담당하고 재사용 로직은 `packages/worker-shared`로 수렴한다.

---

## 10. 최종 메모

이 문서는 "왜/어디로/어느 단계까지"를 설명한다.  
"무엇이 허용/금지되는지"는 `rules.md`를 단일 진실 원천(single source of truth)으로 따른다.

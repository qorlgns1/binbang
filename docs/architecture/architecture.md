# Architecture

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

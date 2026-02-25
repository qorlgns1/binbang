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

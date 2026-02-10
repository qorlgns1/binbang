# Project Structure

이 문서는 현재 저장소의 디렉터리/파일 구조와 각 위치의 책임을 빠르게 파악하기 위한 참고 문서입니다.

## Top-level

```text
binbang/
├── apps/
│   ├── web/                    # Next.js (UI + Route Handlers)
│   └── worker/                 # BullMQ + Playwright 워커
├── packages/
│   ├── db/                     # Prisma 스키마, 마이그레이션, DB 클라이언트
│   └── shared/                 # 공유 코드 (순수 유틸 + 워커 전용)
├── docker/
├── docs/
├── .github/workflows/
├── rules.md                    # 모노레포 강제 규칙
├── RULES_SUMMARY.md
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## apps/web

```text
apps/web/src/
├── app/
│   ├── (app)/                  # 인증 필요 라우트 그룹
│   │   ├── dashboard/          # 대시보드
│   │   │   ├── _components/    # KPI, Action Center, Board, Events 등
│   │   │   ├── _lib/           # types, constants, tracker, generator
│   │   │   ├── dashboardContent.tsx
│   │   │   └── page.tsx
│   │   ├── accommodations/     # 숙소 상세/수정
│   │   └── settings/           # 구독 설정
│   ├── (public)/               # 비인증 라우트 그룹
│   │   ├── [lang]/             # 랜딩 페이지 (i18n)
│   │   ├── login/
│   │   ├── signup/
│   │   └── pricing/
│   ├── admin/                  # 관리자 페이지
│   │   ├── audit-logs/
│   │   ├── heartbeat/
│   │   ├── monitoring/
│   │   ├── plans/
│   │   ├── selectors/
│   │   ├── settings/
│   │   ├── throughput/
│   │   └── users/
│   ├── api/                    # Route Handlers
│   │   ├── accommodations/
│   │   ├── admin/              # 관리자 API
│   │   ├── auth/
│   │   ├── health/
│   │   ├── heartbeat/
│   │   ├── logs/
│   │   ├── plans/
│   │   ├── user/
│   │   └── worker/
│   ├── globals.css             # Tailwind v4 토큰 + 커스텀 애니메이션
│   ├── layout.tsx
│   ├── not-found.tsx
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   ├── ui/                     # shadcn/ui 컴포넌트 (20개)
│   ├── analytics/              # Google Analytics
│   ├── landing/                # 랜딩 페이지 컴포넌트
│   ├── LocalDateTime.tsx
│   ├── app-header.tsx
│   └── providers.tsx           # QueryClient, SessionProvider 등
├── features/                   # 도메인별 React Query 훅/뮤테이션
│   ├── accommodations/
│   ├── admin/
│   ├── heartbeat/
│   ├── logs/
│   ├── plans/
│   ├── user/
│   └── worker/
├── lib/                        # 유틸리티/설정
│   ├── analytics/              # 트래킹 유틸
│   ├── i18n/                   # 다국어 사전
│   ├── utils/
│   ├── auth.ts                 # NextAuth 설정
│   ├── prisma.ts               # Prisma 클라이언트 인스턴스
│   ├── queryKeys.ts            # React Query 키 팩토리
│   ├── rbac.ts                 # isAdmin() 헬퍼
│   ├── rateLimit.ts            # API Rate Limiting
│   └── selectors.ts            # 동적 셀렉터 로더
├── services/                   # Route Handler가 호출하는 서비스 계층
│   ├── admin/
│   ├── accommodations.service.ts
│   ├── auth.service.ts
│   ├── health.service.ts
│   ├── heartbeat.service.ts
│   ├── logs.service.ts
│   ├── plans.service.ts
│   └── user.service.ts
└── types/                      # 웹 앱 전용 타입
```

핵심 원칙:

- Route Handler에서 DB 직접 호출 대신 서비스 계층 사용
- 페이지별 co-located 패턴: `_components/`, `_lib/`로 관련 코드 배치
- 공유 로직은 `packages/shared`로 이동

## apps/worker

```text
apps/worker/src/
├── main.ts              # 워커 엔트리 (BullMQ 큐/워커 초기화)
├── config.ts            # 워커 설정 로드
├── cycleProcessor.ts    # 사이클 잡 처리 (숙소 목록 → check 잡 enqueue)
├── checkProcessor.ts    # 개별 숙소 체크 실행
└── statusUtils.ts       # 상태 판정 유틸
```

핵심 원칙:

- 재사용 가능한 워커 로직은 `@workspace/shared/worker`로 승격
- 앱 레벨은 엔트리/조합 책임 중심

## packages/db

```text
packages/db/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed*.ts
├── src/
│   ├── client.ts         # Prisma Client 생성/설정
│   └── index.ts          # 공개 엔트리 (@workspace/db)
├── prisma.config.ts
└── tsconfig.json
```

핵심 원칙:

- Prisma 스키마/마이그레이션은 이 패키지 단독 소유
- 앱은 `@workspace/db`만 통해 접근

## packages/shared

```text
packages/shared/src/
├── index.ts              # 공개 엔트리 (@workspace/shared)
├── types/
├── checkers/             # 플랫폼별 체커 로직
├── url-parser.ts
├── url-builder.ts        # buildAccommodationUrl
└── worker/               # 워커 전용 (@workspace/shared/worker)
    ├── index.ts
    ├── browser/           # Playwright 브라우저 풀/실행
    ├── jobs/              # 잡 정의 (실행 X)
    ├── runtime/           # 실행 전략 (BullMQ, 스케줄러, 설정)
    └── observability/     # 로깅, 하트비트, 메트릭
```

핵심 원칙:

- `@workspace/shared`: 순수/런타임 중립 코드
- `@workspace/shared/worker`: 워커 전용 코드
- `apps/web`에서 worker 서브패스 import 금지

## docker

```text
docker/
├── web.Dockerfile
├── worker.Dockerfile
├── docker-bake.hcl
├── docker-compose.local.yml
├── docker-compose.develop.yml
└── docker-compose.production.yml
```

## docs

```text
docs/
├── README.md
├── architecture/         # 구조, 모노레포 계획, 이 문서
├── guides/               # 로컬 개발, 배포, RBAC, SEO, 워커 런타임
├── history/              # 변경 이력, 브랜딩, 완료된 스펙
└── backlog/              # 미완료 기능 백로그
```

## 빠른 탐색 명령

```bash
# 디렉터리 구조 확인
find apps packages -maxdepth 3 -type d | sort

# 워크스페이스 import 확인
rg -n "from '@workspace/" apps packages

# DB 접근 코드 확인
rg -n "prisma\." apps/web/src/app/api apps/web/src/services apps/worker/src
```

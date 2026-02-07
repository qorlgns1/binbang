# Architecture

## 규칙 우선

이 저장소의 코드 경계/아키텍처 정책은 아래 문서를 최우선으로 따릅니다.

- `rules.md`
- `RULES_SUMMARY.md`

추가 설계 방향/이행 계획은 아래 문서를 참고합니다.

- `docs/architecture/monorepo-plan.md`

## 모노레포 구조

```text
binbang/
├── .github/
│   └── workflows/                 # CI/CD 워크플로우
├── apps/
│   ├── web/                       # Next.js 앱 (UI + Route Handlers)
│   └── worker/                    # 백그라운드 워커
├── packages/
│   ├── db/                        # Prisma schema/migrations + DB client
│   └── shared/                    # 공용 코드 (@workspace/shared, /worker)
├── docker/
│   ├── docker-compose.local.yml
│   ├── docker-compose.develop.yml
│   ├── docker-compose.production.yml
│   ├── web.Dockerfile
│   └── worker.Dockerfile
├── docs/
│   ├── architecture/
│   │   ├── architecture.md
│   │   └── monorepo-plan.md
│   ├── guides/
│   │   ├── deployment.md
│   │   ├── local-development.md
│   │   └── rbac-local-testing.md
│   ├── history/
│   │   ├── changelog.md
│   │   └── develop-work-units.md
│   └── backlog/
│       ├── rbac-ui-features.md
│       ├── settings-optimization.md
│       └── throughput-and-analysis.md
├── rules.md
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 경계 원칙 요약

- deep import 금지: `packages/**/src/**` 직접 import 금지
- public API만 사용: 패키지 exports로 노출한 entry만 import
- `@shared`는 순수/런타임 중립 코드만 허용
- `@shared/worker`는 worker 전용 코드
- Prisma는 `packages/db`가 단독 소유
- `apps/worker`는 entrypoint/composition 중심, 재사용 로직은 shared로 승격

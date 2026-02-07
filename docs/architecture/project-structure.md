# Project Structure

이 문서는 현재 저장소의 디렉터리/파일 구조와 각 위치의 책임을 빠르게 파악하기 위한 참고 문서입니다.

## Top-level

```text
binbang/
├── apps/
│   ├── web/
│   └── worker/
├── packages/
│   ├── db/
│   └── shared/
├── docker/
├── docs/
├── .github/workflows/
├── rules.md
├── RULES_SUMMARY.md
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## apps/web

```text
apps/web/
├── src/
│   ├── app/                 # App Router pages + Route Handlers
│   ├── components/          # UI 컴포넌트 (shadcn 포함)
│   ├── features/            # 도메인 단위 쿼리/뮤테이션 모듈
│   ├── hooks/               # React Query 기반 훅
│   ├── lib/                 # 인증/유틸/미들웨어성 모듈
│   ├── services/            # 라우트 핸들러가 호출하는 서비스 계층
│   └── types/               # 웹 앱 전용 타입
├── package.json
└── tsconfig.json
```

핵심 원칙:

- 라우트 핸들러에서 DB 직접 호출 대신 서비스 계층 사용
- 공유 로직은 `packages/shared`로 이동

## apps/worker

```text
apps/worker/
├── src/
│   ├── main.ts              # 워커 엔트리/조합 지점
│   ├── config.ts            # 워커 설정 로드
│   ├── processor.ts         # 체크 실행 오케스트레이션
│   └── limiter.ts           # 런타임 제약/제어 보조
├── package.json
└── tsconfig.json
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
│   ├── client.ts            # Prisma client 생성/설정
│   └── index.ts             # 공개 엔트리
├── prisma.config.ts
├── package.json
└── tsconfig.json
```

핵심 원칙:

- Prisma 스키마/마이그레이션은 이 패키지 단독 소유
- 앱은 `@workspace/db`만 통해 접근

## packages/shared

```text
packages/shared/
├── src/
│   ├── index.ts
│   ├── types/
│   ├── url-parser.ts
│   └── worker/
│       ├── index.ts
│       ├── browser/
│       ├── jobs/
│       ├── runtime/
│       └── observability/
├── package.json
└── tsconfig.json
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

용도:

- local/develop/production 환경별 compose 분리
- bake로 web/worker 이미지 빌드/푸시

## docs

```text
docs/
├── README.md
├── architecture/
├── guides/
├── history/
└── backlog/
```

## 빠른 탐색 명령

```bash
find apps packages -maxdepth 3 -type d | sort
rg -n "from '@workspace/" apps packages
rg -n "prisma\\." apps/web/src/app/api apps/web/src/services apps/worker/src
```

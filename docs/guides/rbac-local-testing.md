# 로컬 테스트 가이드 (RBAC + Plan/Quota + AuditLog)

RBAC 개편(Plan/Role/Permission/Quota/AuditLog) 변경사항을 로컬에서 검증하는 절차입니다.

## 사전 준비

- Node.js `24.x`, pnpm
- `.env` 준비: `.env.example`을 복사해서 최소 `DATABASE_URL`, `NEXTAUTH_SECRET` 설정
- 로컬 DB: Docker(Postgres 15) 사용 권장

```bash
cp .env.example .env
```

> DB를 로컬에서 네이티브로 접근하려면 `DATABASE_URL`의 host가 `localhost`여야 합니다.
> (`docker compose` 내부 서비스명인 `db`가 아니라, 로컬 머신에서 접근하는 것이므로 `localhost`)

## 1) DB 실행 (DB만 Docker 권장)

```bash
docker compose -f docker-compose.local.yml up -d db
```

완전 초기화가 필요하면:

```bash
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up -d db
```

## 2) 마이그레이션 적용 + 시드 주입

이 레포는 스키마 변경 테스트 시 `db push` 대신 **migrate** 흐름으로 검증하는 것을 권장합니다.

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
```

### DB 스키마 체크 포인트

- `User.role` 컬럼이 제거되고, 대신 `User.roles`(M:N), `User.planId`가 존재
- `Plan / Role / Permission / PlanQuota / AuditLog` 테이블 생성
- 기존 데이터가 있던 DB라면, 기존 `User.role=ADMIN` 유저가 `_RoleToUser`에 `ADMIN`으로 매핑

## 3) 서버 실행

```bash
pnpm dev
```

워커까지 확인하려면 별도 터미널에서:

```bash
pnpm cron
```

## 4) 로그인(크리덴셜)로 RBAC 스모크 테스트

브라우저에서 `http://localhost:3000/login`

- 관리자: `admin@example.com` / `password123`
- 일반 유저: `user@example.com` / `password123`

### 세션 체크 포인트

- admin 로그인 후 `session.user.roles`에 `["USER", "ADMIN"]` 포함
- user 로그인 후 `session.user.roles`에 `["USER"]` 포함
- `session.user.planName`이 기본 `FREE`로 들어오는지 확인

## 5) 관리자 기능 수동 테스트 체크리스트

1. **/admin 접근 제어**
   - admin 계정: `/admin` 진입 가능
   - user 계정: `/admin` 접근 시 차단/리다이렉트(또는 401 흐름) 확인
2. **관리자 > 유저 목록**
   - 응답/화면에 `roles: string[]`, `planName: string | null` 노출 확인
3. **역할 변경(다중 역할)**
   - Role 변경 다이얼로그에서 `USER/ADMIN` 체크박스로 멀티 선택 가능
   - 역할을 “0개”로 만들 수 없게 막혀있는지(최소 1개)
   - 자기 자신(admin 자신의 역할)은 변경 불가(400) 동작 확인
4. **플랜 변경**
   - 특정 유저의 `planName`을 `FREE/PRO/BIZ`로 변경 후 UI 반영 확인
5. **AuditLog 생성**
   - 역할 변경/플랜 변경 시 AuditLog가 누락 없이 생성

## 6) API로 빠르게 확인 (curl)

### 6-1) 로그인(쿠키 저장)

```bash
curl -i -c cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"password123"}' \
  http://localhost:3000/api/auth/credentials-login
```

> 참고: `NEXTAUTH_URL`이 `https`로 시작하면 cookie name이 `__Secure-next-auth.session-token`으로 바뀝니다.
> 위 방식은 cookie jar(`-c/-b`)를 쓰므로 이름 변경과 무관하게 동작합니다.

### 6-2) 관리자 유저 목록 조회 (여기서 `<USER_ID>` 확보)

```bash
curl -s -b cookies.txt \
  'http://localhost:3000/api/admin/users?limit=5'
```

### 6-3) 특정 유저 역할 변경

```bash
curl -s -X PATCH -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"roles":["USER","ADMIN"]}' \
  'http://localhost:3000/api/admin/users/<USER_ID>/roles'
```

### 6-4) 특정 유저 플랜 변경

```bash
curl -s -X PATCH -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{"planName":"PRO"}' \
  'http://localhost:3000/api/admin/users/<USER_ID>/plan'
```

## 7) DB에서 AuditLog/관계 확인(선택)

Prisma Studio:

```bash
pnpm db:studio
```

확인 포인트:

- `AuditLog.action`: `role.assign`, `plan.change` 생성 여부
- `User.roles`, `User.plan` 관계 로딩 정상 여부
- `PlanQuota.key`: `QuotaKey(MAX_ACCOMMODATIONS, CHECK_INTERVAL_MIN)` 값 존재 여부

## 8) 자동 검증(리그레션)

```bash
pnpm ci:check
```

## 성공 기준

- 로컬에서 `pnpm db:migrate` + `pnpm db:seed`로 재현 가능
- 크리덴셜 로그인 후 세션에 `roles[]`, `planName` 정상 매핑
- admin 전용 라우트/API가 `ADMIN` 역할로만 통과
- 역할/플랜 변경 시 AuditLog가 누락 없이 생성

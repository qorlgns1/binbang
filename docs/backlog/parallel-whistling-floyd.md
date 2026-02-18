# packages/db 마이그레이션 정리 계획

## Context

### 문제 발생 배경

local → development → production 3단계 환경 운영 중, 아래 순서로 마이그레이션이 꼬였다.

1. **development에서 대량의 테스트 커밋** → development DB의 `_prisma_migrations`에 개별 마이그레이션 기록이 쌓임
2. **local에서 기능 단위로 커밋** → local의 마이그레이션 파일 구조와 development DB 상태가 달라짐
3. **production 직접 수정** → 서버에 직접 접속해 `0_current_baseline` 마이그레이션을 생성하고 `prisma migrate resolve --applied`로 적용 표시
4. **`0_current_baseline`이 git으로 커밋** → feature 브랜치에 포함되어 local과 development에도 등장하면서 추가 혼란 발생

### 현재 상태 (분석 결과)

| 항목 | 상태 |
|------|------|
| `0_current_baseline/migration.sql` | feature 브랜치에만 있음 (main에 없음) |
| `0_init/migration.sql` | main + feature 브랜치 모두 있음 |
| `20260216224714_public_seo_snapshot/` | **git 미추적 빈 폴더** (local에만 존재, 서버에는 없음) |
| `sql/` 폴더 파일 3개 | Prisma 마이그레이션 아님, 운영 유틸리티 쿼리 |

### 환경별 예상 `_prisma_migrations` 상태

| 환경 | 예상 상태 |
|------|---------|
| production | `0_init` 또는 그 이전 항목들 + `0_current_baseline` (via --applied) + 이후 일부 마이그레이션 |
| development | 대량의 개별 마이그레이션 + `0_current_baseline` 미기록 |
| local | DB에 따라 다름 + 빈 폴더로 인해 `prisma migrate deploy` 실패 |

---

## 핵심 문제 목록

### 문제 1: 로컬 환경 — 빈 폴더로 `prisma migrate deploy` 실패 (즉시 해결 가능)

`20260216224714_public_seo_snapshot/` 폴더가 로컬에 존재하지만 git에 추적되지 않고 `migration.sql`도 없음.
Prisma는 migrations 디렉토리 내 폴더를 스캔할 때 `migration.sql`이 없으면 에러 발생.
→ **해결: 폴더 삭제** (git 추적 안 되므로 단순 `rm -rf`)

### 문제 2: `0_current_baseline`이 환경별로 `_prisma_migrations`에 불일치

- production에는 이미 `--applied`로 기록됨
- development와 local에는 파일은 있지만 DB에 미기록
- `prisma migrate deploy` 실행 시 Prisma가 `0_current_baseline` SQL을 실제로 실행하려 시도 → 이미 테이블이 존재하므로 에러 발생

### 문제 3: `0_init`과 `0_current_baseline`의 알파벳 순서 충돌

- `0_current_baseline` < `0_init` (c < i, 알파벳 순서)
- Prisma는 migrations를 이름 순으로 정렬해 적용
- 신규 환경(CI, 신규 개발자)에서 `0_current_baseline`이 먼저 실행 → 모든 테이블 생성 → `0_init` 실행 → 동일 테이블 생성 시도 → 에러

### 문제 4: `sql/` 폴더의 역할이 불명확

운영 유틸리티 SQL 3개가 존재하지만 문서화 없음.

---

## 해결 계획

### Step 0: 상태 진단 (실행 전 필수)

각 환경의 현재 마이그레이션 상태를 먼저 확인한다.

```bash
# 로컬
pnpm --filter @workspace/db exec prisma migrate status

# development 서버
pnpm with-env:development:host pnpm --filter @workspace/db exec prisma migrate status

# production 서버
pnpm with-env:production:host pnpm --filter @workspace/db exec prisma migrate status
```

출력에서 확인할 항목:
- `0_init`의 Applied 여부 (각 환경)
- `0_current_baseline`의 Applied 여부 (각 환경)
- 어떤 numbered migration까지 Applied 상태인지

---

### Step 1: 로컬 — 빈 폴더 제거

```bash
rm -rf packages/db/prisma/migrations/20260216224714_public_seo_snapshot/
```

git에 추적되지 않으므로 커밋 불필요. 이후 로컬 `prisma migrate deploy`에서 해당 에러 사라짐.

---

### Step 2: development / local — `0_current_baseline` resolve

`0_current_baseline`은 이미 테이블이 존재하는 DB에 대해 "이미 적용된 것"으로 표시해야 한다.

```bash
# development 서버
pnpm with-env:development:host pnpm --filter @workspace/db exec \
  prisma migrate resolve --applied "0_current_baseline"

# 로컬 (로컬 DB가 이미 스키마를 갖고 있는 경우)
pnpm --filter @workspace/db exec prisma migrate resolve --applied "0_current_baseline"
```

> production은 이미 `--applied` 처리됨 → 스킵.

---

### Step 3: `0_init` 처리 — 환경별 상황에 따라 결정

Step 0 진단 결과에 따라 두 케이스로 나뉜다.

**Case A: `0_init`이 환경 DB에 Applied 상태인 경우**
→ 그대로 유지. 문제 없음.

**Case B: `0_init`이 환경 DB에 없고 `0_current_baseline`만 있는 경우**
→ `0_init`을 resolve --applied 처리:
```bash
prisma migrate resolve --applied "0_init"
```
(테이블은 이미 baseline에서 만들어진 상태이므로 실제 SQL 실행 없이 기록만 남김)

---

### Step 4: 정상 배포 실행

위 처리 후 모든 환경에서 표준 배포 명령 실행:

```bash
# production
pnpm with-env:production:host pnpm --filter @workspace/db exec prisma migrate deploy

# development
pnpm with-env:development:host pnpm --filter @workspace/db exec prisma migrate deploy

# local
pnpm --filter @workspace/db exec prisma migrate deploy
```

이 시점에서 Prisma가 실제 실행하는 마이그레이션은 각 환경에서 아직 Applied 안 된 numbered migration만 해당됨.

---

### Step 5: `sql/` 폴더 정리 (선택, 낮은 우선순위)

현재 파일들은 Prisma 마이그레이션이 아닌 운영 유틸리티. 위치 자체는 적절하나 문서화가 없음.

현재 파일:
- `sql/admin_funnel_snapshot_30d.sql` — Admin KPI 분석 쿼리
- `sql/price_quote_active_uniqueness_check.sql` — 데이터 무결성 검증 쿼리
- `sql/price_quote_active_unique_index_rollback.sql` — 유니크 인덱스 긴급 롤백 스크립트

조치: `packages/db/sql/README.md` 파일 추가하여 이 폴더의 목적과 각 파일 용도 기록.

---

### Step 6: `0_init` 폴더 처리 (장기)

`0_current_baseline`이 `0_init`의 상위 집합이므로, 신규 환경에서의 충돌을 방지하려면 장기적으로 정리가 필요하다.

**단, rules.md 제약**: "배포된 마이그레이션 삭제 금지"
→ production과 development의 `_prisma_migrations`에서 `0_init`이 Applied 상태라면 폴더를 제거할 수 없음.

**Step 0 진단 결과에 따라 결정**:
- production에 `0_init` Applied → 유지 (삭제 불가)
- production에 `0_init` 없음 (baseline만 있음) → 삭제 검토 가능

삭제 가능한 경우 절차:
1. `0_init/migration.sql` 내용을 `0_current_baseline/migration.sql` 주석으로 이동
2. `0_init/` 폴더 제거
3. 모든 환경 `prisma migrate status` 재확인

---

## 수정 대상 파일 / 명령

| 작업 | 대상 | 종류 |
|------|------|------|
| 빈 폴더 삭제 | `packages/db/prisma/migrations/20260216224714_public_seo_snapshot/` | local 파일시스템 |
| resolve --applied | `0_current_baseline` (development, local) | DB 조작 명령 |
| resolve --applied | `0_init` (Case B 해당 환경만) | DB 조작 명령 |
| README 추가 | `packages/db/sql/README.md` | 문서 파일 생성 |

---

## 검증 절차

```bash
# 1. 각 환경별 migrate status 확인 — 모든 항목 "Applied" 상태여야 함
prisma migrate status

# 2. 로컬에서 migrate deploy 정상 실행 확인
pnpm --filter @workspace/db exec prisma migrate deploy

# 3. development 서버 헬스체크
curl -fsS https://<development-url>/api/health

# 4. production 서버 헬스체크
curl -fsS https://binbang.moodybeard.com/api/health
```

---

## 중요 참고

- **`prisma db push` 사용 금지** (rules.md)
- **배포된 마이그레이션 삭제 금지** (rules.md) → Step 0 진단 없이 `0_init` 삭제하면 안 됨
- `prisma migrate resolve --applied`는 SQL을 실행하지 않고 `_prisma_migrations` 테이블에 기록만 추가하는 안전한 명령
- 관련 배포 명령 패턴: `DEPLOYMENT.md` 섹션 4 참조

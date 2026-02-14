# Admin Funnel KPI SoT (P0-9-T1)

목적: 운영 퍼널 1차 릴리즈(P0-9)에서 KPI 정의, 기준 시각, 중복 규칙, 검증 SQL을 고정한다.

## 기준 기간 (Baseline Snapshot)

- UTC 고정: `2026-01-14T00:00:00Z` ~ `2026-02-13T23:59:59.999Z`
- 기대 결과: `submitted=7`, `processed=6`, `paymentConfirmed=2`, `conditionMet=1`

## KPI 정의 (SoT / 기준 시각 / 중복 규칙)

| KPI (alias) | Source of Truth | 기준 시각 컬럼 | 중복/집계 규칙 |
|---|---|---|---|
| `submitted` | `FormSubmission.responseId` | `FormSubmission.createdAt` | `count(distinct FormSubmission.responseId)` |
| `processed` | `FormSubmission.id` (`status='PROCESSED'`) | `FormSubmission.updatedAt` | `count(distinct FormSubmission.id)` |
| `paymentConfirmed` | `Case.id` (`paymentConfirmedAt IS NOT NULL`) | `Case.paymentConfirmedAt` | `count(distinct Case.id)` |
| `conditionMet` | `BillingEvent.caseId` | `BillingEvent.createdAt` | `count(distinct BillingEvent.caseId)` |

## 전환율 정의 (고정)

- 제출→처리: `processed / submitted`
- 처리→결제확인: `paymentConfirmed / processed`
- 결제확인→조건충족: `conditionMet / paymentConfirmed`
- 제출→조건충족: `conditionMet / submitted`

## 검증 SQL

- 파일: `packages/db/sql/admin_funnel_snapshot_30d.sql`
- 결과셋 1: 30일 KPI 스냅샷 1행
- 결과셋 2: 일별 시계열(`date`, `submitted`, `processed`, `paymentConfirmed`, `conditionMet`)

## 실행 방법 (로컬 Docker DB)

```bash
cat packages/db/sql/admin_funnel_snapshot_30d.sql \
  | docker exec -i binbang-db-local psql -U postgres -d accommodation_monitor -f -
```

## 검증 로그

- 로그 파일: `docs/backlog/roadmap/validation/p0-9-t1-psql.log`
- 로그의 스냅샷 행에서 기대 결과(`7/6/2/1`)와 문서 수치 일치를 확인한다.

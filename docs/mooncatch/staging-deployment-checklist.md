# MoonCatch Staging Deployment Checklist

> 최종 업데이트: 2026-02-26
> W5-D1 (Sprint 3)에서 스테이징 인프라 기초 완료

기준 문서:
- `docs/deployment/DEPLOYMENT.md`
- `docs/deployment/ENVIRONMENTS.md`
- `docs/deployment/RUNBOOK.md`
- `docs/llm-context.yaml`

---

## 인프라 준비 현황

| 항목 | 파일 | 상태 |
|---|---|---|
| 스테이징 Docker Compose | `docker/docker-compose.staging.yml` | ✅ W5-D1 완료 |
| 스테이징 환경 변수 예시 | `apps/web/.env.staging.example` | ✅ W5-D1 완료 |
| ENVIRONMENTS.md 스테이징 행 | `docs/deployment/ENVIRONMENTS.md` | ✅ W5-D1 완료 |

---

## 1) 사전 준비 (one-time)

- [ ] 서버 런타임 env 파일 준비
  - `.env.staging` (`.env.staging.example` 기반으로 실제 값 채우기)
  - `.env.staging.local` (선택)
  - `.env.deploy.staging` (CI/CD 기록용)
- [ ] 스테이징 도메인 및 Nginx 업스트림 설정
  - web health endpoint: `/api/health`
- [ ] GitHub Actions 배포 트리거 정의
  - staging branch/tag 규칙
  - staging용 IMAGE_TAG/IMAGE_*_DIGEST 기록

## 2) 배포 직전 Preflight

- [ ] `pnpm ci:check`
- [ ] Prisma migration 준비 상태 확인 (`packages/db/prisma/migrations/*`)
- [ ] 스테이징 비밀값 주입 확인
  - `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
  - OAuth 관련 env (Google, Kakao)
  - MoonCatch env:
    - `MOONCATCH_AGODA_SITE_ID`, `MOONCATCH_AGODA_API_KEY`
    - `MOONCATCH_INTERNAL_API_TOKEN`
    - `MOONCATCH_UNSUBSCRIBE_SECRET`
    - `MOONCATCH_EMAIL_PROVIDER`, `MOONCATCH_RESEND_API_KEY`
    - `MOONCATCH_VACANCY_COOLDOWN_HOURS`, `MOONCATCH_PRICE_DROP_COOLDOWN_HOURS`
    - `MOONCATCH_SNAPSHOT_RETENTION_DAYS`
- [ ] 롤백 기준 버전(이미지 digest) 확보

## 3) 배포 실행 체크

- [ ] 이미지 pull 완료
- [ ] `APP_ENV=staging pnpm db:migrate:deploy` 완료
- [ ] Prisma client generate 완료
- [ ] `docker-compose.staging.yml` `up -d` 완료
- [ ] 컨테이너 상태 확인 (`web`, `redis`)

## 4) 스모크 테스트 (필수)

- [ ] `GET /api/health` 200
- [ ] 로그인 후 호텔 검색 가능 (`/api/hotels/search`)
- [ ] 알림 등록 생성 (`POST /api/accommodations`)
- [ ] internal poll API 수동 트리거 성공
- [ ] notification dispatch 성공 (`agoda_notifications.status='sent'` 1건 이상)
- [ ] 클릭아웃 확인 (`/api/go` 302 + clickout event 기록)
- [ ] `/admin/ops` 정상 렌더링 (스톨 감지 섹션 포함)
- [ ] 알림 이력 확인 (`/accommodations/{id}` → 알림 이력 테이블)

자동 스모크 스크립트:
- `scripts/mooncatch/staging-smoke.sh`
  - 실행 예시:
  - `BASE_URL=https://staging.example.com INTERNAL_TOKEN=*** ./scripts/mooncatch/staging-smoke.sh`

## 5) E2E 완료 조건 검증

- [ ] End-to-end 알림 1건 성공 (등록 → 폴링 → 이메일)
- [ ] End-to-end 클릭아웃 1건 성공 (이메일 CTA → `/api/go` → Agoda redirect)
- [ ] vacancy 이벤트 감지 확인 (이전 poll 결과 없음 → 현재 poll 결과 있음 시 발생)
- [ ] 쿨다운 중복 방지 확인 (동일 오퍼 24시간 내 재발송 없음)
- [ ] `reports/daily.sql` 결과 캡처 저장

## 6) 롤백 체크

- [ ] `.env.deploy.staging`의 IMAGE_TAG/IMAGE_*_DIGEST 이전값으로 되돌릴 수 있는지 확인
- [ ] compose pull + up -d 롤백 절차 테스트
- [ ] 롤백 후 `/api/health` 및 핵심 플로우 재검증

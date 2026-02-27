# 기술 개선 백로그

> improvement-plan.md에서 미완료 항목만 추출 (2026-02-27)
> 완료된 항목(1.x, 2.1, 2.3)은 제거함

---

## 높은 우선순위

### 도메인 에러 타입 도입

현재 서비스 계층에서 `throw new Error('...')` 같은 일반 Error 사용 중.

```
packages/shared/src/errors/
├── base.ts       # AppError (code, statusCode, context)
├── auth.ts       # UnauthorizedError, ForbiddenError
├── resource.ts   # NotFoundError, ConflictError, QuotaExceededError
└── validation.ts # ValidationError
```

대상: `apps/web/src/services/admin/users.service.ts`, `patterns.service.ts` 등

### 환경변수 Zod 검증 스키마

현재 환경변수가 런타임에 개별로 읽히며 누락/잘못된 값이 늦게 발견됨.

- `packages/worker-shared/src/runtime/settings/schema.ts` — Zod 스키마 + 워커 시작 시 fail-fast
- `apps/web` 측도 별도 스키마로 NEXTAUTH_SECRET 등 필수 값 검증

---

## 중간 우선순위

### 구조화된 로깅

현재 `console.error` 기반. `requestId`, `userId`, `action`, `duration`, `error.code` 포함하는 구조화된 로거 필요 (pino 또는 winston).

- `packages/worker-shared/src/observability/logger.ts`
- `apps/web` Route Handler에 요청 ID 미들웨어

### 정적 참조 데이터 캐싱

roles, plans, system settings는 거의 변하지 않는데 매 요청마다 DB 조회 중.
서비스 계층에 TTL 5분 메모리 캐시 적용. Map 기반으로 충분.

### Rate Limiting 보강

현재 구현 여부 불확실. Redis 기반 sliding window로 엔드포인트별 제한 설정.
- 인증 관련: 분당 10회
- 일반: 분당 60회
- 관리자: 분당 120회

### 통합 테스트

주요 시나리오:
1. 숙소 생성 → 체크 처리 → 알림 발송
2. 사용자 쿼터 초과 시 숙소 추가 거부
3. 관리자 설정 변경 → 워커 적용

인프라: testcontainers 또는 docker-compose 기반 PostgreSQL + Redis

---

## 낮은 우선순위

### TODO/FIXME 정리

- `dashboard/_lib/dashboard-tracker.ts` — `TODO: 실제 분석 서비스로 전송`
- `lib/analytics/landing-tracker.ts` — 동일 TODO
- `hooks/index.ts` — `TODO: 컴포넌트들이 직접 @/features에서 import하도록 마이그레이션 후 제거`

### next.config.ts puppeteer 참조 제거

`serverExternalPackages`에 puppeteer가 남아있으나 워커는 Playwright 사용 중. 레거시 설정.

### API 문서화 (OpenAPI)

`zod-to-openapi`로 기존 Zod 스키마에서 자동 생성. 개발 환경 전용 `/api/docs` 엔드포인트.

### 접근성(a11y) 감사 (장기)

biome 접근성 규칙 활성화, Lighthouse CI 통합.

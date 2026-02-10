# 프로젝트 개선 계획서 (Backlog)

> 작성일: 2026-02-10 | 최종 업데이트: 2026-02-10
> 기준 브랜치: `develop`
>
> **최근 반영**: 2.1 서비스 계층 단위 테스트(accommodations, auth, admin/users) 추가, web vitest 설정, pnpm catalog로 vitest 버전 통일. 규칙 준수 1.3·selector 타입 shared 이전 완료.

이 문서는 코드베이스 전체 분석을 통해 도출된 개선 항목을 우선순위별로 정리한 것입니다.

---

## 목차

1. [긴급 (Critical) — 규칙 위반 수정](#1-긴급-critical--규칙-위반-수정)
2. [높은 우선순위 — 품질 기반](#2-높은-우선순위--품질-기반)
3. [중간 우선순위 — 아키텍처 개선](#3-중간-우선순위--아키텍처-개선)
4. [낮은 우선순위 — 개발 경험 향상](#4-낮은-우선순위--개발-경험-향상)
5. [현재 상태 요약](#5-현재-상태-요약)

---

## 1. 긴급 (Critical) — 규칙 위반 수정

### ~~1.1 `@workspace/shared`에서 `@workspace/db` 의존성 제거~~ ✅ 완료

> **완료**: `3a5b322` — `packages/shared/src/types/enums.ts`에 Platform, AvailabilityStatus 독립 정의.
> shared의 4개 파일 import 변경, package.json/tsconfig.json에서 @workspace/db 제거.
> biome.json의 `@repo/db` → `@workspace/db` 오타도 함께 수정.

---

### ~~1.2 `observability/`에서 DB 접근 및 `process.env` 직접 참조 제거~~ ✅ 완료

> **완료**: `42415ce` — heartbeat 로직을 `runtime/heartbeat.ts`로, 카카오 토큰 관리를
> `runtime/notifications.ts`로 이동. `observability/kakao/message.ts`는 순수 HTTP 전송만 유지.
> `observability/heartbeat/` 디렉토리 삭제. 소비자(worker) import를 runtime으로 변경.

---

### ~~1.3 `browser/`에서 DB 직접 접근 제거~~ ✅ 완료

> **완료**: selector 로딩/캐시를 `packages/worker-shared/src/runtime/selectors/`로 이동.
> `browser/selectors/index.ts`는 타입만 re-export. `checkAirbnb`/`checkAgoda`는 `selectorCache`를 옵션으로 주입받음.
> `apps/worker`는 runtime의 `getPlatformSelectors`, `invalidateSelectorCache`, `loadPlatformSelectors` 사용.

---

### ~~1.4 `jobs/`에서 `@workspace/db` 타입 import 제거~~ ✅ 완료

> **완료**: `3a5b322` — 1.1과 함께 해결. `@workspace/db` → `@workspace/shared`로 import 변경.

---

## 2. 높은 우선순위 — 품질 기반

### 2.1 테스트 코드 작성

**현황**: vitest가 모든 패키지에 설정되어 있으나, 실제 테스트 파일이 거의 없음. 모든 `test` 스크립트에 `--passWithNoTests` 플래그 사용 중.

**목표**: 핵심 비즈니스 로직에 대한 단위 테스트 커버리지 80% 이상

**우선 작성 대상**:

| 영역 | 대상 파일 | 이유 | 상태 |
|------|-----------|------|------|
| Services | `apps/web/src/services/accommodations.service.ts` | 핵심 CRUD + 쿼터 로직 | ✅ 완료 |
| Services | `apps/web/src/services/auth.service.ts` | 인증/회원가입 로직 | ✅ 완료 |
| Services | `apps/web/src/services/admin/users.service.ts` | 관리자 사용자 관리 | ✅ 완료 |
| Shared | `packages/shared/src/` 내 유틸리티 함수들 | 순수 함수, 테스트 용이 | (기존 일부 있음) |
| Worker | `packages/worker-shared/src/runtime/settings/` | 환경 설정 검증 로직 | 미작업 |
| Browser | `packages/worker-shared/src/browser/` 내 체커 로직 | 가격 파싱, URL 처리 | 미작업 |

**작업 항목**:
1. ~~서비스 계층 단위 테스트 (prisma mock 활용)~~ ✅ accommodations, auth, admin/users 완료. web `vitest.config.ts` 및 `pnpm catalog`로 vitest 버전 통일.
2. shared 패키지 순수 함수 테스트 (기존 checkers 등 유지, 추가 확대 가능)
3. worker-shared runtime/settings 테스트
4. browser checker 단위 테스트
5. CI에서 커버리지 리포트 생성 설정

---

### 2.2 도메인 특화 에러 타입 도입

**현황**: 서비스 계층에서 `throw new Error('User not found')` 같은 일반 Error 사용. Route Handler에서 에러 종류 구분 불가.

**대상 파일**:
- `apps/web/src/services/admin/users.service.ts`
- `apps/web/src/services/admin/patterns.service.ts`
- 기타 서비스 파일들

**해결 방안**:

```
packages/shared/src/errors/
├── base.ts           # AppError 기본 클래스 (code, statusCode, context)
├── auth.ts           # UnauthorizedError, ForbiddenError
├── resource.ts       # NotFoundError, ConflictError, QuotaExceededError
└── validation.ts     # ValidationError
```

**기대 효과**:
- Route Handler에서 에러 코드 기반 HTTP 상태 매핑 가능
- 로깅 시 에러 컨텍스트(userId, resourceId 등) 자동 포함
- 클라이언트에 구조화된 에러 응답 제공

---

### ~~2.3 서비스 계층 select 절 중복 제거~~ ✅ 완료

> **완료**: `ACCOMMODATION_SELECT`, `CHECK_LOG_SELECT` 상수 추출.
> `getAccommodationsByUserId`, `getAccommodationById`, `createAccommodation`, `updateAccommodation`, `getAccommodationLogs`에서 재사용.

---

### 2.4 환경변수 검증 스키마 도입

**현황**: 환경변수가 런타임에 개별적으로 읽히며, 누락/잘못된 값이 늦게 발견됨. 검증 스키마 없음.

**해결 방안**:

1. `packages/worker-shared/src/runtime/settings/schema.ts` — Zod 스키마 정의
   ```
   DATABASE_URL: z.string().url()
   REDIS_URL: z.string().url()
   WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(100)
   BROWSER_POOL_SIZE: z.coerce.number().int().min(1).max(20)
   ...
   ```
2. 워커 시작 시 스키마 검증 → 실패 시 즉시 종료 (fail-fast)
3. `apps/web` 측도 별도 스키마로 NEXTAUTH_SECRET 등 필수 값 검증

**기대 효과**: 배포 시 잘못된 설정으로 인한 런타임 에러 사전 방지

---

## 3. 중간 우선순위 — 아키텍처 개선

### 3.1 API 문서화 (OpenAPI/Swagger)

**현황**: 20개 이상의 API 라우트가 존재하나 문서화 없음. Zod 스키마는 이미 정의되어 있음.

**해결 방안**:
1. `zod-to-openapi` 라이브러리로 기존 Zod 스키마에서 OpenAPI 스펙 자동 생성
2. `/api/docs` 엔드포인트에 Swagger UI 제공 (개발 환경 전용)
3. CI에서 OpenAPI 스펙 파일 자동 생성 및 검증

**작업 파일**:
- `apps/web/package.json` — `zod-to-openapi` 의존성 추가
- 각 API 라우트의 Zod 스키마에 OpenAPI 메타데이터 추가
- `apps/web/src/app/api/docs/` — Swagger UI 페이지 (신규, 개발 전용)

---

### 3.2 구조화된 로깅 시스템 도입

**현황**: 에러 로깅이 `console.error`로 이루어지며, 요청 ID나 사용자 컨텍스트가 부족함.

**해결 방안**:
1. `packages/worker-shared/src/observability/logger.ts` — 구조화된 로거 (pino 또는 winston)
2. 로그에 포함할 컨텍스트: `requestId`, `userId`, `action`, `duration`, `error.code`
3. `apps/web` Route Handler에 요청 ID 미들웨어 추가
4. 워커 로그에 `jobId`, `accommodationId` 컨텍스트 자동 추가

**기대 효과**: 프로덕션 디버깅 시간 단축, 에러 추적 용이

---

### 3.3 통합 테스트 추가

**현황**: 단위 테스트도 없는 상태에서 통합 테스트는 당연히 부재.

**우선 테스트 시나리오**:
1. 숙소 생성 → 체크 처리 → 알림 발송 플로우
2. 관리자 설정 변경 → 워커가 새 설정 적용
3. 사용자 쿼터 초과 시 숙소 추가 거부
4. Prisma 마이그레이션 정합성 검증

**필요 인프라**:
- 테스트용 PostgreSQL (docker-compose 또는 testcontainers)
- 테스트용 Redis
- 테스트 데이터 시드 스크립트

---

### 3.4 정적 참조 데이터 캐싱

**현황**: `apps/web/src/services/admin/users.service.ts`에서 매 요청마다 roles, plans 테이블을 조회함. 이 데이터는 거의 변하지 않음.

**해결 방안**:
1. 서비스 계층에 메모리 캐시 (TTL 5분) 적용
2. 관리자가 role/plan 변경 시 캐시 무효화
3. 간단한 Map 기반 캐시로 충분 (외부 라이브러리 불필요)

**대상 데이터**: roles 목록, plans 목록, system settings

---

### 3.5 CORS 설정 명시화

**현황**: Next.js 기본 동작에 의존하며 명시적 CORS 설정 없음.

**해결 방안**:
1. `apps/web/src/middleware.ts`에 CORS 헤더 설정 추가
2. 허용 origin을 환경변수로 관리
3. API 라우트별 필요 시 세밀한 제어

---

### 3.6 Rate Limiting 구현 확인 및 보강

**현황**: 코드에 rate limiting 참조가 있으나 실제 구현이 확인되지 않음.

**해결 방안**:
1. API 라우트에 rate limiting 미들웨어 적용 (Redis 기반 sliding window)
2. 엔드포인트별 제한 설정: 인증 관련(분당 10회), 일반(분당 60회), 관리자(분당 120회)
3. 429 응답에 `Retry-After` 헤더 포함

---

## 4. 낮은 우선순위 — 개발 경험 향상

### 4.1 `next.config.ts`에서 puppeteer 참조 제거

**현황**: `serverExternalPackages`에 puppeteer가 포함되어 있으나, 워커는 Playwright 사용 중. 레거시 설정으로 보임.

**작업 파일**: `apps/web/next.config.ts`

---

### 4.2 TypeScript 경로 별칭 정리

**현황**: 각 패키지마다 별도의 `@/*` 별칭이 정의되어 있어 약간 파편화됨.

**해결 방안**: `tsconfig.base.json`에 공통 별칭 규칙을 통합하고, 패키지별 tsconfig는 상속만 하도록 정리

---

### 4.3 TODO/FIXME 항목 정리

**현황**:
- `apps/web/src/app/(app)/dashboard/_lib/dashboard-tracker.ts` — `TODO: 실제 분석 서비스로 전송`
- `apps/web/src/lib/analytics/landing-tracker.ts` — 동일 TODO
- `apps/web/src/hooks/index.ts` — `TODO: 컴포넌트들이 직접 @/features에서 import하도록 마이그레이션 후 제거`

**작업**: 각 TODO를 해결하거나, 이 백로그에 별도 항목으로 등록 후 코드에서 제거

---

### 4.4 접근성(a11y) 감사

**현황**: 웹 앱 UI가 존재하나 접근성 테스트가 수행된 적 없음.

**해결 방안**:
1. `eslint-plugin-jsx-a11y` 또는 biome의 접근성 규칙 활성화
2. Lighthouse 접근성 점수 CI 통합
3. 주요 페이지에 대한 키보드 네비게이션 테스트

---

### 4.5 E2E 테스트 도입 검토 (장기)

**현황**: 브라우저 기반 E2E 테스트 없음.

**해결 방안**:
1. Playwright를 활용한 E2E 테스트 환경 구축
2. 주요 사용자 플로우 테스트: 로그인 → 숙소 등록 → 대시보드 확인
3. CI에서 E2E 테스트 실행 (별도 stage)

---

## 5. 현재 상태 요약

| 영역 | 상태 | 점수 | 비고 |
|------|------|------|------|
| 모노레포 구조 | 우수 | 9/10 | 경계 명확, biome으로 강제 |
| TypeScript 설정 | 우수 | 9/10 | strict 모드, 경로 별칭 |
| 린팅/포매팅 | 우수 | 9/10 | biome이 아키텍처 규칙까지 강제 |
| 데이터베이스 | 우수 | 9/10 | Prisma 스키마 정돈, 마이그레이션 관리 |
| 문서화 | 양호 | 8/10 | 규칙/아키텍처 문서 충실; API 문서 부재 |
| 빌드/배포 | 양호 | 8/10 | Turbo + Docker 잘 구성됨 |
| 보안 | 양호 | 7/10 | Auth/RBAC/감사 로그 있음; CORS/Rate Limit 보강 필요 |
| 에러 처리 | 보통 | 5/10 | 동작하지만 일반적; 도메인 에러 타입 필요 |
| 관측성 | 보통 | 5/10 | heartbeat 있음; 구조화된 로깅 필요 |
| **테스트** | **보통** | **5/10** | **web 서비스 계층 단위 테스트 추가(accommodations, auth, admin/users); shared checkers 등 일부 있음** |
| **규칙 준수** | **우수** | **9/10** | **1.3 완료(browser→runtime 제거), selector 타입 shared로 이전** |

---

## 실행 로드맵

### Phase 1 — 즉시 (1~2주)

- [x] 1.1 shared → db 의존성 제거 (enum 이동) ✅ `3a5b322`
- [x] 1.2 observability DB/env 접근 → runtime으로 이동 ✅ `42415ce`
- [x] 1.3 browser DB 접근 → runtime으로 이동 ✅
- [x] 1.4 jobs db 타입 → shared에서 import ✅ `3a5b322`
- [x] 2.3 accommodations.service.ts select 절 중복 제거 ✅

### Phase 2 — 단기 (2~4주)

- [x] 2.1 핵심 서비스 계층 단위 테스트 작성 (1차) ✅ accommodations, auth, admin/users + web vitest 설정, pnpm catalog
- [ ] 2.2 도메인 에러 타입 도입
- [ ] 2.4 환경변수 Zod 검증 스키마

### Phase 3 — 중기 (1~2개월)

- [ ] 3.1 API 문서화 (OpenAPI)
- [ ] 3.2 구조화된 로깅 시스템
- [ ] 3.3 통합 테스트 추가
- [ ] 3.4 정적 참조 데이터 캐싱
- [ ] 3.5 CORS 설정
- [ ] 3.6 Rate Limiting 보강

### Phase 4 — 장기 (2~3개월+)

- [ ] 4.1~4.5 개발 경험 향상 항목들
- [ ] E2E 테스트 환경 구축
- [ ] 접근성 감사

---

## 관련 문서

- [rules.md](../../rules.md) — 프로젝트 규칙 (최우선)
- [RULES_SUMMARY.md](../../RULES_SUMMARY.md) — 규칙 요약
- [throughput-and-analysis.md](./throughput-and-analysis.md) — 기능 백로그 (처리량/가격 분석)
- [docs/architecture/](../architecture/) — 아키텍처 문서

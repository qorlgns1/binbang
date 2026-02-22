# Error Handling 표준화 — 전체 작업 로그 (PR #114 반영)

## 기준

- PR: `https://github.com/qorlgns1/binbang/pull/114` (2026-02-22 기준 `OPEN`)
- 목적: 서버-클라이언트 에러 흐름을 단일 계약으로 통일

```
AppError (throw) → handleServiceError → ErrorResponseBody (wire)
                                         ↓
                               parseApiError → ApiError (catch)
                                         ↓
                               getUserMessage → UI 메시지
```

---

## Phase 0 — AppError 계층 강화 + 서비스 레이어 전환 ✅

**커밋**: `e51c5cb`, `41c6aa3`

### 반영 내용

- `packages/shared/src/errors/base.ts`
  - `AppError`의 `name`을 `new.target.name`으로 설정해 서브클래스 이름 자동 반영
  - `captureStackTrace` 안전 호출
- `packages/shared/src/errors/system.ts`
  - `InternalServerError` 신규 추가 (`500`, `INTERNAL_SERVER_ERROR`)
- 서비스 레이어에서 `throw new Error(...)`를 `AppError` 계층으로 교체
  - `NotFoundError`, `ConflictError`, `BadRequestError`, `ForbiddenError`, `InternalServerError` 중심
  - 대상: `apps/web/src/services/**`, `apps/travel/src/services/conversation.service.ts`
- 테스트 보강
  - `packages/shared/src/errors/errors.test.ts`
  - `apps/web/src/lib/handleServiceError.test.ts`

### 효과

- 서비스에서 던진 에러 코드/상태가 라우트에서 일관되게 매핑됨
- 문자열 매칭 기반 분기를 줄이고 타입 기반 처리로 전환됨

---

## Phase 1 — Route Handler 에러 응답 통일 ✅

**커밋**: `12dd458`

### 문제

Route Handler에서 에러 응답 패턴이 혼재:

| 패턴 | 문제 |
|------|------|
| 메시지 문자열 매칭 (`if message === 'X'`) | AppError 도입 이후 status 매핑 불안정 |
| `{ error: string }` | 클라이언트 파싱 표준과 불일치 |
| 로컬 `errorResponse()` | 필드 스키마 불일치 |

### 해결

**목표**: 모든 라우트 에러 응답을 `ErrorResponseBody` (`{ error: { code, message, details? } }`)로 통일

- `apps/web/src/lib/handleServiceError.ts`
  - `unauthorizedResponse`
  - `badRequestResponse`
  - `validationErrorResponse`
  - `notFoundResponse`
- `apps/travel/src/lib/handleServiceError.ts` 신규 추가 (`Response` 기반)
- web + travel route 전반에서 인라인 에러 응답 제거 후 헬퍼/핸들러로 교체

### 결과

- 단일 에러 스키마 정착
- 라우트 별 분기 코드 단순화
- `handleServiceError` 테스트 커버리지 확장

---

## Phase 2 — 클라이언트 에러 파싱 표준화 ✅

**커밋**: `cb7043f`

### 문제

- `!res.ok` 파싱 로직이 기능/파일별로 분산
- `ErrorResponseBody` 타입 정의가 app 단에 중복
- 일부 기능(`QUOTA_EXCEEDED`)이 구 포맷 전제 코드로 깨짐

### 해결

- `packages/shared/src/errors/apiError.ts` 신규
  - `ErrorResponseBody` 인터페이스
  - `ApiError` 클래스
- `packages/shared/src/errors/index.ts` re-export 추가
- `apps/web/src/lib/apiError.ts`, `apps/travel/src/lib/apiError.ts` 신규
  - `parseApiError(res, fallbackMessage)` 도입
- mutation 계층 정리
  - `apps/web/src/features/accommodations/mutations.ts`
  - `apps/web/src/features/admin/plans/mutations.ts`
  - `apps/web/src/features/admin/selectors/mutations.ts`
  - `apps/web/src/features/admin/users/mutations.ts`
- `apps/travel/src/components/chat/chatPanelUtils.ts`
  - `RATE_LIMITED` 코드 감지 추가

### 결과

- 양 앱에서 동일한 파싱 계약 사용
- 클라이언트 에러 처리 분기 단순화

---

## Phase 3 — UI 메시지 통일 (별도 커밋) ✅

**커밋**: `1ce09a1` (PR #114 범위 외, 선행 반영됨)

### 반영 내용

- `apps/web/src/lib/apiError.ts`에 `getUserMessage` 추가
- web 주요 화면/컴포넌트에서 `error.message` 직접 노출 대신 코드 기반 메시지 사용
- `QuotaExceededError` 제거 후 `ApiError.code` 중심으로 정리

---

## Phase 4 — Admin 잔여 API 에러 스키마 통일 ✅

**커밋**: `e34f102`

### 반영 내용

- `apps/web/src/lib/handleServiceError.ts`
  - `serviceUnavailableResponse` 추가
- Admin API 잔여 라우트의 레거시 에러 응답 정리
  - `apps/web/src/app/api/admin/awin/**`
  - `apps/web/src/app/api/admin/selectors/test/route.ts`
  - `apps/web/src/app/api/admin/worker/**`
- 레거시 `{ error: string }` 응답을 소비하던 관리자 UI 호출부 정렬

### 검증

- `pnpm --filter @workspace/web lint`
- `pnpm --filter @workspace/web typecheck`
- `pnpm ci:check`

---

## Phase 5 — Validation details 필드 매핑 ✅

**커밋**: `7d4ad5f`

### 반영 내용

- `apps/web/src/lib/apiError.ts`
  - `getValidationDetails`, `getValidationFieldErrors` 추가
- web 폼에서 `VALIDATION_ERROR.details`를 필드 에러에 매핑
  - `apps/web/src/app/(app)/accommodations/new/page.tsx`
  - `apps/web/src/app/(app)/accommodations/[id]/edit/page.tsx`
  - `apps/web/src/app/admin/plans/_components/PlanDialog.tsx`
  - `apps/web/src/app/admin/selectors/_components/SelectorForm.tsx`
  - `apps/web/src/app/admin/selectors/_components/PatternForm.tsx`
- selectors/patterns API에 Zod 검증 응답(details) 정렬

### 검증

- `pnpm --filter @workspace/web lint`
- `pnpm --filter @workspace/web typecheck`
- `pnpm ci:check`

---

## Phase 6 — Travel UI 메시지 표준화 ✅

**커밋**: `1db8be4`

### 반영 내용

- `apps/travel/src/lib/apiError.ts`
  - `getUserMessage` 추가 (`ApiError.code` 기반 사용자 메시지)
- `apps/travel/src/components/chat/ChatPanel.tsx`
  - raw `error.message` 직접 사용 제거
  - `ApiError.code === RATE_LIMITED` 우선 분기 + 레거시 문자열 휴리스틱 보조
- `apps/travel/src/components/chat/ChatPanelSections.tsx`
  - 배너 메시지를 props로 받아 공통 메시지 정책 사용
- `apps/travel/src/hooks/useRateLimitLoginPrompt.ts`
  - 중복 로그인 프롬프트 키를 `errorMessage` 대신 `errorKey`로 일반화
- `apps/travel/src/app/login/page.tsx`
  - 알 수 없는 로그인 에러의 raw 코드 노출 제거
- 테스트 보정
  - `apps/travel/src/components/chat/ChatPanel.ratelimit.test.tsx`

### 검증

- `pnpm --filter @workspace/travel lint`
- `pnpm --filter @workspace/travel typecheck`
- `pnpm format:check`

---

## Phase 7 — Admin `alert()` 제거 및 toast 통일 ✅

**커밋**: `95f68a4`

### 반영 내용

- web 공통 provider에 toast renderer 추가
  - `apps/web/src/components/Providers.tsx`
- selectors 관리 화면의 `alert()` 제거 후 `sonner` toast로 전환
  - `apps/web/src/app/admin/selectors/_components/SelectorForm.tsx`
  - `apps/web/src/app/admin/selectors/_components/PatternForm.tsx`
  - `apps/web/src/app/admin/selectors/_components/SelectorManager.tsx`
- web 패키지에 `sonner` 의존성 명시
  - `apps/web/package.json`
  - `pnpm-lock.yaml`

### 검증

- `rg -n "alert\\(" apps/web/src/app/admin/selectors/_components`
- `pnpm --filter @workspace/web lint`
- `pnpm --filter @workspace/web typecheck`
- `pnpm --filter @workspace/web test`
- `pnpm format:check`

---

## Phase 8 — `parseApiError` shared 승격 ✅

**커밋**: `41a690f`

### 반영 내용

- `packages/shared/src/errors/apiError.ts`
  - 공용 `parseApiError` 구현 추가
- `packages/shared/src/errors/index.ts`
  - `parseApiError` public export 추가
- 앱 단 중복 구현 제거
  - `apps/web/src/lib/apiError.ts`
  - `apps/travel/src/lib/apiError.ts`
- shared 테스트 보강
  - `packages/shared/src/errors/errors.test.ts`

### 검증

- `pnpm --filter @workspace/shared lint`
- `pnpm --filter @workspace/shared typecheck`
- `pnpm --filter @workspace/shared test`
- `pnpm --filter @workspace/web typecheck`
- `pnpm --filter @workspace/travel typecheck`
- `pnpm format:check`

---

## Phase 9 — PR 코멘트 후속 반영 ✅

**커밋**: (이번 작업 커밋)

### 반영 내용

- 401/403 의미 불일치 정리
  - `apps/travel/src/lib/handleServiceError.ts`: `forbiddenResponse` 추가
  - `apps/travel/src/app/api/conversations/[id]/affiliate-preference/route.ts`: `unauthorizedResponse('Forbidden')` → `forbiddenResponse()`
- malformed JSON 요청을 400으로 매핑
  - `apps/web/src/app/api/admin/plans/route.ts`
  - `request.json()` 파싱 실패 시 `badRequestResponse('Invalid JSON')` 반환

### 검증

- `pnpm --filter @workspace/web lint`
- `pnpm --filter @workspace/web typecheck`
- `pnpm --filter @workspace/travel lint`
- `pnpm --filter @workspace/travel typecheck`
- `pnpm format:check`

---

## 현재 남은 갭 (코드 스캔 기준)

- 현재 범위 기준 잔여 갭 없음 (TODO-1~5 완료)

---

## 다음 TODO LIST (구체 실행안)

### TODO-1 (P0) 잔여 API 라우트 에러 스키마 완전 통일 ✅ 완료

**작업**

- 아래 파일의 에러 응답을 모두 `ErrorResponseBody`로 통일하고 공통 헬퍼 사용
  - `apps/web/src/app/api/admin/awin/linkbuilder/route.ts`
  - `apps/web/src/app/api/admin/awin/offers/route.ts`
  - `apps/web/src/app/api/admin/awin/programmedetails/route.ts`
  - `apps/web/src/app/api/admin/awin/programmes/route.ts`
  - `apps/web/src/app/api/admin/awin/reports/advertiser/route.ts`
  - `apps/web/src/app/api/admin/awin/transactions/route.ts`
  - `apps/web/src/app/api/admin/awin/advertisers/sync/route.ts`
  - `apps/web/src/app/api/admin/selectors/test/route.ts`
  - `apps/web/src/app/api/admin/worker/public-availability/run/route.ts`
  - `apps/web/src/app/api/admin/worker/queue/route.ts`

**완료 조건 (DoD)**

- 위 파일에서 에러 분기가 모두 `{ error: { code, message, details? } }` 형태
- 인라인 `NextResponse.json({ ok: false, ... })` 제거
- worker/서비스 불가 케이스도 코드(`SERVICE_UNAVAILABLE` 등) 포함

**검증**

- `rg -n "ok:\\s*false|success:\\s*false|error:\\s*'|error:\\s*\\\""` `apps/web/src/app/api/admin/awin` `apps/web/src/app/api/admin/selectors/test/route.ts` `apps/web/src/app/api/admin/worker`
- `pnpm ci:check`

### TODO-2 (P0) Validation details를 폼 필드 에러로 연결 ✅ 완료

**작업**

- `apps/web/src/lib/apiError.ts`에 `getValidationDetails(error: Error)` 유틸 추가
- 아래 폼에서 `ApiError(code === 'VALIDATION_ERROR')` 시 `details`를 필드 에러로 매핑
  - `apps/web/src/app/(app)/accommodations/new/page.tsx`
  - `apps/web/src/app/(app)/accommodations/[id]/edit/page.tsx`
  - `apps/web/src/app/admin/plans/_components/PlanDialog.tsx`
  - `apps/web/src/app/admin/selectors/_components/SelectorForm.tsx`
  - `apps/web/src/app/admin/selectors/_components/PatternForm.tsx`

**완료 조건 (DoD)**

- 서버 검증 실패 시 토스트/배너 한 줄 메시지 + 필드별 메시지 동시 노출
- 폼 수정 후 재제출 시 해당 필드 에러 해제 동작 확인

**검증**

- 각 폼에서 의도적으로 invalid payload 제출 후 필드 에러 렌더링 확인
- `pnpm --filter @workspace/web test`

### TODO-3 (P1) Travel UI 에러 메시지 표준화 ✅ 완료

**작업**

- `apps/travel/src/lib/apiError.ts`에 `getUserMessage` 추가 (web과 동일 규칙)
- `apps/travel/src/components/chat/ChatPanel.tsx` 등에서 `error.message` 직접 노출 제거
- 필요 시 로그인 화면의 로컬 메시지 맵(`apps/travel/src/app/login/page.tsx`)과 정책 정렬

**완료 조건 (DoD)**

- Travel UI에서 서버 내부 영문 메시지 직접 노출 없음
- `ApiError.code` 기준 사용자 메시지 사용

**검증**

- travel 주요 시나리오(로그인 실패/채팅 실패/rate-limit) 수동 확인

### TODO-4 (P1) Admin `alert()` 제거 후 toast로 통일 ✅ 완료

**작업**

- 대상 파일
  - `apps/web/src/app/admin/selectors/_components/SelectorForm.tsx`
  - `apps/web/src/app/admin/selectors/_components/PatternForm.tsx`
  - `apps/web/src/app/admin/selectors/_components/SelectorManager.tsx`
- 에러/성공 알림을 `window.alert()`에서 프로젝트 공통 toast로 교체

**완료 조건 (DoD)**

- 위 파일에서 `alert(` 문자열 제거
- 성공/실패 메시지 모두 toast 출력

**검증**

- `rg -n "alert\\(" apps/web/src/app/admin/selectors/_components`
- 수동 플로우: 생성/수정/삭제/캐시 무효화

### TODO-5 (P2) 중복 유틸 정리 (shared로 승격) ✅ 완료

**작업**

- `parseApiError`를 `@workspace/shared/errors`로 이동해 web/travel 중복 제거
- (선택) `handleServiceError` 본문 생성 로직도 shared 함수로 분리

**완료 조건 (DoD)**

- app별 `parseApiError` 구현 중복 제거
- 기존 시그니처 유지로 호출부 변경 최소화

**검증**

- 타입체크 + 기존 mutation/route 테스트 통과
- `pnpm ci:check`

# PR #100 코드리뷰 반영 및 의견 정리

코드리뷰에서 지적된 사항에 대한 수정 반영과, 남은 제안에 대한 생각을 정리한다.

---

## 1. 반영 완료한 항목

### 1.1 Worker DB 로직 위치 (rules.md §8 위반)

**지적**: `apps/worker`에 DB 로직(travelGuestCleanup)이 있으면 안 됨. Domain/DB logic은 `@workspace/worker-shared`로.

**반영**:  
- `cleanupTravelGuestConversations`를 `packages/worker-shared/src/runtime/travelGuestCleanup.ts`로 이동.
- `apps/worker/src/cycleProcessor.ts`는 `@workspace/worker-shared/runtime`에서 import해 호출만 하도록 수정.
- `apps/worker/src/travelGuestCleanup.ts` 삭제.

**의견**: 규칙대로라면 worker 앱은 wiring만 담당해야 하므로 이전이 맞다. 기존 `landingEventRetention`, `caseExpiration` 등과 동일한 패턴으로 맞춰 두었다.

---

### 1.2 Rate limit — 인증 유저 경로의 `incrementCount`

**지적**: 인증 유저는 DB 기반 한도만 사용하는데, onFinish에서 게스트/유저 구분 없이 `incrementCount` 호출 → 유저 경로에서는 불필요한 코드.

**반영**:  
- `onFinish` 안에서 `if (!session?.user?.id)`일 때만 `incrementCount` 호출하도록 변경.

**의견**: 동작은 그대로이고, “게스트일 때만 in-memory 카운터를 갱신한다”는 의도가 코드에 드러나서 유지보수에 유리하다.

---

### 1.3 merge-session 호출 시 쿠키 전달

**지적**: `fetch('/api/auth/merge-session')`에 `credentials: 'include'`가 없으면, body에 sessionId를 안 넣고 쿠키만으로 병합하는 경우 일부 환경에서 쿠키가 안 갈 수 있음.

**반영**:  
- `useSessionMerge`의 fetch 옵션에 `credentials: 'include'` 추가.

**의견**: same-origin이라 기본으로 쿠키가 갈 수 있지만, 스펙상 명시해 두는 편이 안전하고, 크로스오리진/프록시 등 나중에 바뀌어도 동작이 유지된다.

---

## 2. 리뷰에서 제안된 선택 항목에 대한 생각

### 2.1 에러 메시지 404 vs 403

**제안**: “Not found or unauthorized”를 404로만 반환하지 말고, 소유권 불일치는 403으로 구분하는 방안.

**의견**:  
- 지금은 “없음”과 “권한 없음”을 의도적으로 같은 메시지로 내려서, 존재 여부를 노출하지 않는 보안 관점도 있다.
- 클라이언트에서 “삭제 실패” vs “권한 없음”을 구분해 UX를 다르게 할 계획이 있다면 403 도입을 검토하면 되고, 당장은 현재 방식으로 두어도 무방하다고 본다.

### 2.2 Rate limit env 로딩

**제안**: `rate-limit.service.ts`의 `process.env` 접근을 travel 앱의 env 검증/로딩 레이어로 모을 수 있다.

**의견**:  
- Phase 2 범위에서는 서비스 내부에서 읽는 현재 방식으로도 규칙 위반은 아니다.
- 나중에 travel 전용 env 스키마(예: `validateTravelEnv`)를 도입할 때 여기서 쓰는 변수들(`TRAVEL_GUEST_DAILY_LIMIT` 등)을 그 스키마로 끌어오면 된다.

---

## 3. 정리

- **필수로 보였던 항목**(Worker DB 로직 위치, incrementCount 조건, merge-session credentials)은 모두 반영했다.
- **선택 제안**(404/403 구분, env 일원화)은 현재 단계에서는 유지·보류하고, Phase 3 또는 운영 요구가 생기면 그때 반영하는 쪽을 권장한다.

위 반영 사항은 커밋 `refactor(travel,worker): 코드리뷰 반영 — DB 로직 worker-shared 이전, rate limit/merge 개선`에 포함되어 있다.

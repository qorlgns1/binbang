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

---

## 4. PR에 달린 코멘트(CodeRabbit 등)에 대한 의견

PR #100에는 **CodeRabbit 자동 리뷰** 코멘트가 여러 개 달려 있다. 각각에 대한 생각을 정리한다.

### 4.1 반드시 반영하는 게 좋은 것

| 위치 | 내용 | 의견 |
|------|------|------|
| **conversation.service.ts** | `/api/chat`에서 `conversationId` 소유권 검증 없이 다른 유저 대화에 메시지 추가 가능 | **동의.** `existingConversation`이 있고 `userId`가 다른 경우(다른 유저 소유)에 대한 거부 로직이 없음. API 라우트에서 `getConversation` 후 `conversation.userId !== session.user.id`면 403 반환하거나, 서비스에서 `existingConversation.userId != null && existingConversation.userId !== userId`일 때 거부하는 쪽으로 수정하는 게 맞다. |
| **HistorySidebar.tsx** | 항목 전체를 `<button>`으로 감싸고 내부에 편집/삭제 `<button>` 중첩 → HTML 규격 위반, 접근성 문제 | **동의.** button 중첩은 명세 위반이고 키보드/스크린리더 동작이 깨질 수 있다. 외부를 `div role="button"` + `tabIndex={0}` + `onKeyDown`(Enter/Space)로 바꾸는 제안이 타당하다. |
| **auth.ts** | Kakao 토큰 저장이 `signIn` 콜백에서만 이루어짐. `signIn`은 User/Account 생성 **전**에 실행되므로 첫 로그인 시 `findAccountUserId`가 실패해 토큰이 안 들어감 | **동의.** NextAuth 문서대로라면 토큰 저장은 `events.createUser` 또는 `events.linkAccount`로 옮기는 게 맞다. |

### 4.2 반영하면 좋은 것 (Minor / 방어·일관성)

| 위치 | 내용 | 의견 |
|------|------|------|
| **place-photo/route.ts** | `photoName`을 URL에 그대로 넣어서 `?`, `#` 등 예약 문자가 들어가면 경로/쿼리가 깨짐 | **동의.** `photoName` 형식 검증 시 예약 문자(`[?#]` 등) 차단하거나, 허용 패턴만 통과시키는 검증을 넣는 게 안전하다. |
| **login/page.tsx** | `callbackUrl` 명시적 검증(상대 경로만 허용) | NextAuth 버전이 이미 CVE 패치된 구간이면 기본 동작으로도 막히지만, 방어 심화로 `rawCallback.startsWith('/') ? rawCallback : '/'` 정도 넣어 두면 명확하다. |
| **page.tsx** | `authStatus === 'loading'`일 때도 로그인 유도 모달이 뜰 수 있음 | **동의.** 로딩 중에는 모달을 띄우지 않고 `return`하는 편이 UX상 맞다. |
| **PlaceCard.tsx** | "No image" → 한국어 UI와 일관되게 | 사소하지만 한국어 앱이면 "이미지 없음" 등으로 통일하는 게 낫다. |
| **phase2-auth-history.md** | 검색 범위가 "제목/내용"으로 되어 있는데 구현은 제목만 | **동의.** 문서를 “제목 기준 검색”으로 맞추는 게 맞다. |
| **apps/web/.env.example**, **apps/worker/.env.example** | `EMAIL_FROM` 값에 따옴표 권장 | 공백/특수문자 포함 시 파서에 따라 잘릴 수 있으니 따옴표로 감싸는 제안이 맞다. |

### 4.3 참고만 해도 되는 것

| 위치 | 내용 | 의견 |
|------|------|------|
| **login/page.tsx** (useSearchParams) | `useSearchParams` 사용 시 Suspense boundary 필요 | 로그인 페이지가 이미 동적 라우트이거나 빌드에서 문제 없으면 당장 필수는 아닐 수 있음. 빌드/정적 생성 이슈가 있으면 그때 감싸면 된다. |
| **MapPanel.tsx**, **next-auth.d.ts** | 각각 Tailwind/aspect 관련, 타입 관련 | 내용 확인 후 필요하면 반영. |

### 4.4 “코멘트 달린 것에 대해 어떻게 생각하냐고 물었을 때” 답변용 요약

- 전반적으로 **CodeRabbit이 짚은 대로인 부분이 많다.** 특히 **다른 유저 대화에 메시지 붙는 권한 버그**, **HistorySidebar button 중첩 접근성**, **Kakao 첫 로그인 토큰 미저장** 세 가지는 **실제 동작/보안 이슈**라서 수정하는 게 좋다고 본다.
- 나머지는 방어 강화·문서·일관성·UX 개선 수준이라, 우선순위 두고 단계적으로 반영하면 된다.
- “자동 리뷰가 다 맞는 건 아니지만, 이 PR 코멘트들은 대부분 타당하고, 위 세 가지는 꼭 반영하고 나머지는 여유 있을 때 처리하면 된다”고 말하면 된다.

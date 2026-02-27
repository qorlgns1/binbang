# Binbang 카카오 직접 메시지 알림 구현 계획

## Context

Binbang 사용자가 빈방/가격 하락을 감지했을 때 이메일뿐 아니라 카카오톡으로도 즉시 알림을 받을 수 있도록 한다.

- 현재: `AgodaNotification` → 이메일 발송만 지원
- 목표: 카카오톡 직접 메시지(OAuth 기반) 병행 발송

**기존 인프라 (재사용):**
- `User.kakaoAccessToken / kakaoRefreshToken / kakaoTokenExpiry` 필드 존재
- `saveKakaoTokens(userId, tokens)` — `auth.service.ts`
- `hasKakaoToken(userId)` — `user.service.ts`
- `sendKakaoMessage(payload, accessToken)` — `notifications.service.ts`
- `refreshKakaoToken(userId, refreshToken)` — `notifications.service.ts`
- Dashboard `NOTIFICATION_NOT_CONNECTED` 액션카드 + `navigate_kakao` CTA — 이미 존재하나 `signOut → signIn('kakao')` 방식이라 기존 데이터 유실 위험 있음 → **수정 필요**

---

## 구현 범위 (5개 작업)

### Step 1. Kakao Custom OAuth Connect API (신규)

이메일 로그인 사용자가 현재 세션을 유지한 채로 카카오 계정을 연동한다.
기존 `signOut → signIn('kakao')` 방식은 세션과 데이터를 날릴 위험이 있으므로 교체한다.

**`src/app/api/user/kakao/connect/route.ts`** (GET)
- 세션 확인 (미인증 → 401)
- CSRF state 생성: `crypto.randomUUID()` → `kakao_oauth_state` 쿠키(httpOnly, 5분 만료)에 저장
- Kakao OAuth authorize URL로 redirect:
  ```
  https://kauth.kakao.com/oauth/authorize
    ?client_id=KAKAO_CLIENT_ID
    &redirect_uri={NEXTAUTH_URL}/api/user/kakao/callback
    &response_type=code
    &scope=talk_message
    &state={state}
  ```

**`src/app/api/user/kakao/callback/route.ts`** (GET)
- `state` 검증 (쿠키와 비교, 불일치 → 400)
- `code` → `https://kauth.kakao.com/oauth/token` POST로 토큰 교환
- `saveKakaoTokens(session.user.id, tokens)` 호출
- 쿠키 제거 → `/dashboard?kakao=linked` redirect

**사전 설정 (1회):** Kakao Developer Console에서 `{NEXTAUTH_URL}/api/user/kakao/callback`을 Redirect URI로 추가 필요.

---

### Step 2. `lib/kakao/sendKakaoMemo.ts` 추출 (신규)

`notifications.service.ts`에 있는 카카오 발송 로직을 공유 라이브러리로 추출한다.

**`src/lib/kakao/sendKakaoMemo.ts`**
- `getValidKakaoAccessToken(userId)`: DB에서 토큰 조회 → 만료 5분 전이면 refresh → 반환
  - refresh 실패 시 null 반환 (발송 skip, 에러 throw 금지)
- `sendKakaoMemo(template, accessToken)`: `kapi.kakao.com/v2/api/talk/memo/default/send` POST
  - template 타입: `{ object_type: 'text', text: string, link: {...}, button_title: string }`
  - 10초 timeout (AbortController)
  - 실패 시 false 반환

재사용 원칙: 기존 `notifications.service.ts`의 동일 로직을 복사하지 말고 이 함수를 import해서 사용.

---

### Step 3. `services/agoda-kakao.service.ts` (신규)

Binbang 알림 메시지 템플릿 빌더.

**`src/services/agoda-kakao.service.ts`**
```
buildBinbangKakaoTemplate(params):
  - alertType = 'vacancy' → "🏨 [호텔명] 빈방이 감지됐어요!\n체크인: ...\n체크아웃: ...\n매진 전에 확인하세요!"
  - alertType = 'price_drop' → "💸 [호텔명] 가격이 N% 떨어졌어요!\n현재 가격: X원"
  - link.web_url, link.mobile_web_url → clickoutUrl (기존 buildClickoutUrl 재사용)
  - button_title → "예약 페이지 이동"

sendBinbangKakaoNotification(userId, params):
  - getValidKakaoAccessToken(userId) → null이면 skip (return false)
  - buildBinbangKakaoTemplate → sendKakaoMemo
  - 반환: boolean (성공/실패, 예외 미전파)
```

---

### Step 4. `agoda-notification.service.ts` 수정 (기존 파일)

이메일 발송 후 카카오도 시도한다 (fire-and-forget, 카카오 실패가 이메일 상태에 영향 없음).

**변경 사항:**
1. user select에 `kakaoAccessToken: true, kakaoTokenExpiry: true` 추가
2. 이메일 발송 성공(`kind: 'sent'`) 처리 직후 조건부 카카오 발송:
   ```ts
   if (notification.accommodation.user?.kakaoAccessToken) {
     await sendBinbangKakaoNotification(userId, params).catch(() => {});
   }
   ```
3. DB 상태 업데이트 로직 그대로 유지 (kakao 성공/실패 별도 추적 없음, MVP)

---

### Step 5. DashboardContent.tsx CTA 수정 (기존 파일)

`navigate_kakao` 케이스를 올바른 연동 흐름으로 교체한다.

**변경 위치:** `src/app/(app)/dashboard/DashboardContent.tsx`
```ts
// 기존 (문제): signOut 후 signIn → 이메일 계정 데이터 유실 위험
case 'navigate_kakao':
  await signOut({ redirect: false });
  await signIn('kakao', { callbackUrl: '/dashboard' });

// 변경: 세션 유지한 채 custom connect 엔드포인트로 이동
case 'navigate_kakao':
  router.push('/api/user/kakao/connect');
  break;
```

---

## 수정/생성 파일 목록

| 작업 | 파일 |
|------|------|
| 신규 | `src/app/api/user/kakao/connect/route.ts` |
| 신규 | `src/app/api/user/kakao/callback/route.ts` |
| 신규 | `src/lib/kakao/sendKakaoMemo.ts` |
| 신규 | `src/services/agoda-kakao.service.ts` |
| 수정 | `src/services/agoda-notification.service.ts` |
| 수정 | `src/app/(app)/dashboard/DashboardContent.tsx` |

DB 스키마 변경 없음 (기존 User 토큰 필드 재사용).

---

## 환경 변수 (추가 없음)

기존 `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`만 필요.
단, Kakao Developer Console에서 redirect URI 추가 등록 필요:
- 개발: `http://localhost:3320/api/user/kakao/callback`
- 운영: `https://{도메인}/api/user/kakao/callback`

---

## 검증

1. 이메일 계정으로 로그인 → Dashboard에서 "카카오 연동하기" 카드 확인
2. 클릭 → Kakao OAuth 페이지 진입 → 동의 → `/dashboard?kakao=linked` redirect
3. DB에서 `User.kakaoAccessToken` 값 확인
4. `/api/internal/accommodations/{id}/poll` 수동 호출 → vacancy 이벤트 생성
5. `/api/internal/accommodations/notifications/dispatch` 호출 → 이메일 + 카카오 동시 발송 확인
6. 카카오톡 앱에서 메시지 수신 확인

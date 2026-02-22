# 계획서: Sentry 도입 — apps/travel

## Context

현재 `apps/travel`에는 중앙화된 에러 모니터링이 없다.
클라이언트 에러는 `ErrorBoundary.tsx`의 `console.error`로만 소비되고,
서버 에러는 각 Route Handler/Service에서 흩어진 `console.log`로 처리된다.
Sentry를 도입해 클라이언트·서버·엣지 런타임의 에러와 퍼포먼스를 중앙에서 관찰한다.

---

## 참고 문서

- https://docs.sentry.io/platforms/javascript/guides/nextjs/

---

## 변경 파일 목록

### 신규 생성

| 파일 | 역할 |
|------|------|
| `apps/travel/instrumentation-client.ts` | 클라이언트 SDK 초기화 (Next.js 15 client instrumentation hook) |
| `apps/travel/instrumentation.ts` | 서버/엣지 SDK 등록 + `onRequestError` export |
| `apps/travel/sentry.server.config.ts` | Node.js 런타임 SDK 설정 |
| `apps/travel/sentry.edge.config.ts` | Edge 런타임 SDK 설정 |
| `apps/travel/src/app/global-error.tsx` | App Router 글로벌 에러 UI (root layout 대체) |

### 수정

| 파일 | 변경 내용 |
|------|-----------|
| `apps/travel/package.json` | `@sentry/nextjs` dependency 추가 |
| `apps/travel/next.config.ts` | `withSentryConfig` 래핑 추가 |
| `apps/travel/src/components/ErrorBoundary.tsx` | `componentDidCatch`에서 `Sentry.captureException` 호출 |
| `apps/travel/.env.example` | Sentry 관련 환경변수 항목 추가 |

---

## 세부 구현 계획

### 1. 패키지 설치

`apps/travel/package.json` dependencies에 추가:
```json
"@sentry/nextjs": "^8.0.0"
```

이후 `pnpm install` 실행.

---

### 2. 클라이언트 초기화 — `instrumentation-client.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.05,   // 5% 일반 세션
  replaysOnErrorSampleRate: 1.0,    // 에러 발생 세션 100%

  integrations: [Sentry.replayIntegration()],

  // /monitoring 터널로 광고 차단기 우회
  tunnel: '/monitoring',
});
```

> DSN이 설정되지 않으면 Sentry는 아무것도 전송하지 않음 — 개발 환경에서 자연스럽게 비활성화 가능.

---

### 3. 서버 설정 — `sentry.server.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
```

---

### 4. 엣지 설정 — `sentry.edge.config.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
```

---

### 5. 서버/엣지 등록 — `instrumentation.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Next.js 서버 에러 (Server Components, Route Handlers) 자동 캡처
export const onRequestError = Sentry.captureRequestError;
```

---

### 6. next.config.ts 수정

```typescript
import { withSentryConfig } from '@sentry/nextjs';
// ... 기존 nextConfig 정의 ...

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // /monitoring 경로로 Sentry 요청을 프록시 (광고 차단기 우회)
  tunnelRoute: '/monitoring',

  // CI가 아닌 로컬 빌드 시 소스맵 업로드 로그 억제
  silent: !process.env.CI,

  // 브라우저에 소스맵 노출 방지 (Sentry로만 업로드)
  hideSourceMaps: true,
});
```

---

### 7. global-error.tsx 생성

`src/app/global-error.tsx` — root layout 수준에서 발생한 에러를 잡는 Next.js App Router 규약 파일.
`ErrorBoundary`가 잡지 못하는 layout 에러까지 커버한다.

```tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import './globals.css'; // Tailwind 클래스 사용을 위해 직접 import

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang='ko'>
      <body className='flex min-h-screen flex-col items-center justify-center gap-4 px-4'>
        <p className='text-center font-medium'>문제가 발생했어요</p>
        <p className='text-center text-sm text-muted-foreground'>잠시 후 다시 시도해 주세요.</p>
        <button
          type='button'
          onClick={reset}
          className='rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors'
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
```

> `global-error.tsx`는 layout을 대체하기 때문에 독립적인 `<html>/<body>`를 포함해야 함.

---

### 8. ErrorBoundary.tsx 수정

`componentDidCatch`에 Sentry 캡처 추가:

```typescript
// 추가
import * as Sentry from '@sentry/nextjs';

// componentDidCatch 수정
componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
  Sentry.captureException(error, {
    extra: { componentStack: errorInfo.componentStack },
  });
}
```

---

### 9. .env.example 업데이트

```dotenv
# ─── Sentry ──────────────────────────────────────
# DSN: Sentry 프로젝트 > Settings > Client Keys 에서 확인
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=

# 환경 구분 (development / staging / production)
# 미설정 시 NODE_ENV 값을 사용
NEXT_PUBLIC_SENTRY_ENVIRONMENT=
SENTRY_ENVIRONMENT=

# 소스맵 업로드용 (빌드 시에만 필요, CI에서 주로 사용)
# Sentry > Settings > Auth Tokens 에서 발급
SENTRY_AUTH_TOKEN=
SENTRY_ORG=your-sentry-org-slug
SENTRY_PROJECT=travel
```

---

## 에러 캡처 커버리지 정리

| 발생 위치 | 캡처 수단 |
|-----------|-----------|
| React 컴포넌트 렌더링 에러 | `ErrorBoundary.componentDidCatch` → `Sentry.captureException` |
| Root layout 수준 에러 | `global-error.tsx` → `Sentry.captureException` |
| Next.js Server Component 에러 | `instrumentation.ts`의 `onRequestError` |
| Route Handler 에러 | `instrumentation.ts`의 `onRequestError` |
| 클라이언트 미처리 Promise rejection | Sentry SDK 자동 캡처 |

---

## 환경변수 설명

| 변수 | 비밀 여부 | 설명 |
|------|-----------|------|
| `NEXT_PUBLIC_SENTRY_DSN` | 공개 가능 | 클라이언트에서 사용하는 DSN. DSN 자체는 공개해도 안전 (수집만 가능, 조회 불가) |
| `SENTRY_DSN` | 공개 가능 | 서버/엣지에서 사용 (`NEXT_PUBLIC_SENTRY_DSN`과 동일 값) |
| `SENTRY_AUTH_TOKEN` | **비밀** | 소스맵 업로드 전용. 빌드 서버 환경변수에만 설정 |
| `SENTRY_ORG` | 공개 가능 | Sentry 조직 slug |
| `SENTRY_PROJECT` | 공개 가능 | Sentry 프로젝트 slug |

---

## 검증 방법

1. `pnpm install` — `@sentry/nextjs` 설치 확인
2. `pnpm --filter @workspace/travel dev` — 로컬 서버 기동 확인 (빌드 에러 없음)
3. Sentry DSN 설정 후 의도적 에러 발생 → Sentry 대시보드에서 이벤트 수신 확인
4. `pnpm ci:check` — 전체 lint/typecheck 통과

---

## 주의사항

- `SENTRY_AUTH_TOKEN`은 `.env.local`에 넣더라도 **절대 커밋하지 말 것** (`.gitignore` 확인)
- `tracesSampleRate` 프로덕션 값 `0.1`은 트래픽 볼륨에 따라 조정 필요
- Session Replay는 사용자 화면을 녹화하므로 개인정보 처리방침 검토 필요

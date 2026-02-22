import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  // 요청 헤더, 사용자 IP 등 기본 PII 수집 — opt-in (NEXT_PUBLIC_SENTRY_SEND_DEFAULT_PII=true 설정 시 활성화)
  sendDefaultPii: process.env.NEXT_PUBLIC_SENTRY_SEND_DEFAULT_PII === 'true',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration()],
  tunnel: '/monitoring',
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

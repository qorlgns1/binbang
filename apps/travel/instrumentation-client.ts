import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,

  // 요청 헤더, 사용자 IP 등 기본 PII 수집 (디버깅 컨텍스트 향상)
  sendDefaultPii: true,

  // Performance Monitoring — 프로덕션 10%, 개발 100%
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay — 일반 세션 10%, 에러 발생 세션 100%
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [Sentry.replayIntegration()],

  // /monitoring 터널을 통해 광고 차단기 우회
  tunnel: '/monitoring',
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

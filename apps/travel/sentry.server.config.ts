import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,

  // 요청 헤더, 사용자 IP 등 기본 PII 수집 (디버깅 컨텍스트 향상)
  sendDefaultPii: true,

  // Performance Monitoring — 프로덕션 10%, 개발 100%
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});

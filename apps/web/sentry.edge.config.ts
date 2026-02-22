import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  // 요청 헤더, 사용자 IP 등 기본 PII 수집 — opt-in (SENTRY_SEND_DEFAULT_PII=true 설정 시 활성화)
  sendDefaultPii: process.env.SENTRY_SEND_DEFAULT_PII === 'true',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});

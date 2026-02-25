import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,

  sendDefaultPii: process.env.SENTRY_SEND_DEFAULT_PII === 'true',

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});

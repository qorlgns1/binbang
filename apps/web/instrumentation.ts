import * as Sentry from '@sentry/nextjs';
import { validateWebEnv } from '@/lib/env';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    validateWebEnv();
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;

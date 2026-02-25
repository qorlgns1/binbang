import type { NextConfig } from 'next';

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withSentryConfig } from '@sentry/nextjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  transpilePackages: ['@workspace/db', '@workspace/shared'],

  outputFileTracingRoot: path.join(__dirname, '../../'),

  experimental: {
    optimizePackageImports: ['lucide-react', '@workspace/db'],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  tunnelRoute: '/monitoring',

  sourcemaps: { deleteSourcemapsAfterUpload: process.env.SENTRY_ENVIRONMENT === 'production' },

  silent: !process.env.CI,

  errorHandler: (err) => {
    console.warn('[Sentry] 소스맵 업로드 실패:', err.message);
  },
});

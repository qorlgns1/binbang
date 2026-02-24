import type { NextConfig } from 'next';

import { withSentryConfig } from '@sentry/nextjs';
import bundleAnalyzer from '@next/bundle-analyzer';
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const withNextIntl = createNextIntlPlugin();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  // Monorepo: transpile workspace packages
  transpilePackages: ['@workspace/db', '@workspace/shared'],

  // Monorepo: output file tracing for standalone build
  outputFileTracingRoot: path.join(__dirname, '../../'),

  // External images (landing page)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'img1.kakaocdn.net',
      },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'radix-ui', '@workspace/db'],
  },
};

export default withSentryConfig(withBundleAnalyzer(withNextIntl(nextConfig)), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  tunnelRoute: '/monitoring',
  // production에서만 .map 파일 삭제 — development 배포 환경에서는 소스맵을 남겨 DevTools 디버깅 허용
  sourcemaps: { deleteSourcemapsAfterUpload: process.env.SENTRY_ENVIRONMENT === 'production' },
  silent: !process.env.CI,
  errorHandler: (err) => {
    console.warn('[Sentry] 소스맵 업로드 실패:', err.message);
  },
});

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

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'places.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', '@workspace/db'],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // /monitoring 경로로 Sentry 요청을 프록시 (광고 차단기 우회)
  tunnelRoute: '/monitoring',

  // CI가 아닌 로컬 빌드 시 소스맵 업로드 로그 억제
  silent: !process.env.CI,

  // 소스맵 업로드 실패 시 빌드를 중단하지 않고 경고만 출력
  errorHandler: (err) => {
    console.warn('[Sentry] 소스맵 업로드 실패:', err.message);
  },
});

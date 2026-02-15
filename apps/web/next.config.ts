import type { NextConfig } from 'next';

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

  // Server-side only packages (puppeteer for worker)
  serverExternalPackages: [
    'puppeteer',
    'puppeteer-core',
    'puppeteer-extra',
    'puppeteer-extra-plugin',
    'puppeteer-extra-plugin-stealth',
  ],

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

export default withBundleAnalyzer(withNextIntl(nextConfig));

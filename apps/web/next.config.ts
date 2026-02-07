import type { NextConfig } from 'next';

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
};

export default nextConfig;

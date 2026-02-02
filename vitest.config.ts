import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(rootDir, 'src'),
    },
  },
});

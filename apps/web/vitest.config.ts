import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': resolve(rootDir, 'src'),
      '@/generated/*': resolve(rootDir, '../../packages/db/generated/*'),
      '@workspace/db': resolve(rootDir, '../../packages/db/src'),
      '@workspace/db/enums': resolve(rootDir, '../../packages/db/src/enums.ts'),
      '@workspace/shared': resolve(rootDir, '../../packages/shared/src'),
    },
  },
});

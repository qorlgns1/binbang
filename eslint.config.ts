// eslint.config.ts
import eslint from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import prettierConfig from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  // 무시할 파일/폴더
  globalIgnores([
    '**/node_modules/',
    '**/.next/',
    '**/out/',
    '**/build/',
    '**/dist/',
    '**/generated/',
    '*.config.js',
    '*.config.mjs',
    '**/next-env.d.ts',
  ]),

  // 기본 JS 규칙
  eslint.configs.recommended,

  // TypeScript 규칙
  ...tseslint.configs.recommended,
  ...tseslint.configs.strict,

  // React + Next.js 규칙
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin as unknown as Record<string, unknown>,
      '@next/next': nextPlugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // React
      ...reactPlugin.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // Next.js
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,

      // TypeScript
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'TypeScript enum은 금지입니다. union type + const object 패턴을 사용하세요.',
        },
        {
          selector: 'SwitchCase[test=null]',
          message: 'switch의 default는 금지입니다. exhaustive switch를 사용하세요.',
        },
      ],

      // console.log 허용
      'no-console': 'off',

      // 상위 폴더 상대경로 import 금지 (같은 폴더 ./는 허용)
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*'],
              message: '상대경로 대신 절대경로(@/)를 사용하세요.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      // 모든 함수 return type 명시 (tsx 제외로 컴포넌트 규칙 충돌 방지)
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: false,
          allowHigherOrderFunctions: false,
          allowTypedFunctionExpressions: false,
        },
      ],

      // export 함수/모듈 경계도 타입을 강제하고 싶으면(선택):
      '@typescript-eslint/explicit-module-boundary-types': 'error',
    },
  },

  // Prettier 충돌 방지
  prettierConfig,
);

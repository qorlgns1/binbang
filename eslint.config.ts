// eslint.config.ts
import eslint from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import prettierConfig from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * ============================================================================
 * Helpers (중복 제거 + TS 타입 에러 없이 RuleConfig 튜플 반환)
 * ============================================================================
 */

type RestrictedImportPattern = { group: readonly string[]; message: string };
type RestrictedImportPath = { name: string; message: string; allowTypeImports?: boolean };

type NoRestrictedImportsOptions = {
  patterns?: RestrictedImportPattern[];
  paths?: RestrictedImportPath[];
};

// ESLint RuleConfig가 기대하는 형태: [Severity, Options]
type NoRestrictedImportsRule = ['error', { patterns: RestrictedImportPattern[]; paths: RestrictedImportPath[] }];

function makeNoRestrictedImports(options: NoRestrictedImportsOptions): NoRestrictedImportsRule {
  return [
    'error',
    {
      patterns: options.patterns ?? [],
      paths: options.paths ?? [],
    },
  ];
}

const baseRestrictedImportPatterns: RestrictedImportPattern[] = [
  {
    group: ['../*'],
    message: '상대경로 대신 절대경로(@/)를 사용하세요.',
  },
  {
    group: ['**/packages/*/src/**'],
    message: 'Deep imports는 금지입니다. 패키지의 공개 진입점을 사용하세요. (rules.md 2.1)',
  },
];

const baseRestrictedImportPaths: RestrictedImportPath[] = [
  {
    name: '@prisma/client',
    message: '@prisma/client 직접 임포트는 금지입니다. @repo/db를 사용하세요. (rules.md 5.2)',
    allowTypeImports: true,
  },
];

const baseNoRestrictedImports = makeNoRestrictedImports({
  patterns: baseRestrictedImportPatterns,
  paths: baseRestrictedImportPaths,
});

function extendNoRestrictedImports(extra: NoRestrictedImportsOptions): NoRestrictedImportsRule {
  const baseOptions = baseNoRestrictedImports[1];

  return makeNoRestrictedImports({
    patterns: [...(baseOptions.patterns ?? []), ...(extra.patterns ?? [])],
    paths: [...(baseOptions.paths ?? []), ...(extra.paths ?? [])],
  });
}

/**
 * ============================================================================
 * Config
 * ============================================================================
 */

export default defineConfig(
  // --------------------------------------------------------------------------
  // Global ignores (린트 대상 제외)
  // --------------------------------------------------------------------------
  globalIgnores([
    '**/node_modules/',
    '**/.next/',
    '**/out/',
    '**/build/',
    '**/dist/',
    '**/coverage/',
    '**/.turbo/',
    '**/.cache/',
    '**/generated/',
    'packages/db/generated',
    '**/.env',
    '**/.env.*',
    '*.config.js',
    '*.config.mjs',
    '**/next-env.d.ts',
    'docs/',
    'pnpm-lock.yaml',
  ]),

  // --------------------------------------------------------------------------
  // Base recommended (JS)
  // --------------------------------------------------------------------------
  eslint.configs.recommended,

  // --------------------------------------------------------------------------
  // TypeScript base configs (syntax-level)
  // --------------------------------------------------------------------------
  ...tseslint.configs.recommended,
  ...tseslint.configs.strict,

  // --------------------------------------------------------------------------
  // JS/JSX (espree)
  // --------------------------------------------------------------------------
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // --------------------------------------------------------------------------
  // TS/TSX (typescript-eslint parser)
  // --------------------------------------------------------------------------
  {
    files: ['**/*.{ts,tsx}'],
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
  },

  // --------------------------------------------------------------------------
  // React + Next + Policy rules (공통)
  // --------------------------------------------------------------------------
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin as unknown as Record<string, unknown>,
      '@next/next': nextPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // JS vs TS 중복/충돌 방지(특히 TS 프로젝트에서 폭발 방지)
      'no-undef': 'off',
      'no-unused-vars': 'off',

      // React
      ...reactPlugin.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // Next.js
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,

      // TypeScript (공통)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',

      // 정책: enum 금지 + switch default 금지
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

      // 정책: import 제한 (베이스)
      'no-restricted-imports': baseNoRestrictedImports,

      // console.log 허용
      'no-console': 'off',
    },
  },

  // --------------------------------------------------------------------------
  // TS only: return type 강제 (tsx 제외)
  // --------------------------------------------------------------------------
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: false,
          allowHigherOrderFunctions: false,
          allowTypedFunctionExpressions: false,
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
    },
  },

  // --------------------------------------------------------------------------
  // Test files: return type 강제 해제
  // --------------------------------------------------------------------------
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },

  // --------------------------------------------------------------------------
  // Config/Tooling files: return type 강제 해제 (eslint.config.ts가 린트 에러 나는 것 방지)
  // --------------------------------------------------------------------------
  {
    files: ['eslint.config.ts', '**/*.config.{ts,js,mjs,cjs}', '**/scripts/**/*.{ts,js}', '**/tools/**/*.{ts,js}'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },

  // --------------------------------------------------------------------------
  // apps/web: @shared/worker 임포트 금지 (rules.md 3.2)
  // --------------------------------------------------------------------------
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': extendNoRestrictedImports({
        patterns: [
          {
            group: ['@shared/worker', '@shared/worker/*'],
            message: 'apps/web에서 @shared/worker 임포트는 금지입니다. (rules.md 3.2)',
          },
        ],
      }),
    },
  },

  // --------------------------------------------------------------------------
  // packages/shared: Node 모듈/DB/fetch 금지 (rules.md 3.1)
  // --------------------------------------------------------------------------
  {
    files: ['packages/shared/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': extendNoRestrictedImports({
        patterns: [
          {
            group: ['node:*', 'fs', 'path', 'child_process', 'http', 'https', 'net', 'os'],
            message: '@shared에서 Node 모듈 사용은 금지입니다. (rules.md 3.1)',
          },
        ],
        paths: [
          {
            name: '@repo/db',
            message: '@shared에서 DB 접근은 금지입니다. (rules.md 3.1)',
          },
        ],
      }),
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: '@shared에서 fetch 사용은 금지입니다. (rules.md 3.1)',
        },
      ],
    },
  },

  // --------------------------------------------------------------------------
  // packages/db: @prisma/client 허용 (DB 전용 패키지)
  // - 베이스 정책 중 "@prisma/client 금지"만 제거한 버전을 사용
  // --------------------------------------------------------------------------
  {
    files: ['packages/db/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': makeNoRestrictedImports({
        patterns: [
          {
            group: ['../*'],
            message: '상대경로 대신 절대경로(@/)를 사용하세요.',
          },
        ],
        paths: [],
      }),
    },
  },

  // --------------------------------------------------------------------------
  // Prettier 충돌 방지
  // --------------------------------------------------------------------------
  prettierConfig,
);

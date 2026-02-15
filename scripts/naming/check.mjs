#!/usr/bin/env node
/**
 * Enforced naming check for source files/folders.
 *
 * Scope:
 * - apps/<app>/src/**
 * - packages/<pkg>/src/**
 *
 * Rules:
 * - .tsx files: PascalCase (with optional .test/.spec/.stories suffix)
 * - .ts files: camelCase (with optional .test/.spec/.stories suffix)
 * - folders: kebab-case
 *
 * Exceptions:
 * - Next reserved files: page.tsx, layout.tsx, route.ts, loading.tsx, error.tsx, not-found.tsx, template.tsx, default.tsx
 * - apps/web/src/components/ui/**: filename checks skipped (shadcn compatibility)
 * - apps/web/src/services/**: *.service.ts and *.service.test.ts must use kebab-case prefixes
 * - __tests__, __snapshots__ folders
 * - route segment folders in app router: [id], (group), @slot
 */

import { execSync } from 'node:child_process';
import path from 'node:path';

const RESERVED_NEXT_FILES = new Set([
  'page.tsx',
  'layout.tsx',
  'route.ts',
  'loading.tsx',
  'error.tsx',
  'not-found.tsx',
  'template.tsx',
  'default.tsx',
  'next-auth.d.ts',
]);

const errors = [];

function isKebabCase(input) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input);
}

function isCamelCase(input) {
  return /^[a-z][A-Za-z0-9]*$/.test(input);
}

function isPascalCase(input) {
  return /^[A-Z][A-Za-z0-9]*$/.test(input);
}

function isRouteSegmentException(segment) {
  if (segment.startsWith('@')) return true;
  if (/^\(.*\)$/.test(segment)) return true;
  if (/^\[.*\]$/.test(segment)) return true;
  return false;
}

function splitStemAndSuffix(stem) {
  const match = stem.match(/^(.*)\.(test|spec|stories)$/);
  if (!match) return { core: stem, suffix: null };
  return { core: match[1], suffix: match[2] };
}

function addError(filePath, message) {
  errors.push(`${filePath}: ${message}`);
}

function validateFolderSegments(filePath) {
  const segments = filePath.split('/');
  const isAppRouterPath = filePath.startsWith('apps/web/src/app/');

  for (let i = 3; i < segments.length - 1; i += 1) {
    const segment = segments[i];

    if (segment === '__tests__' || segment === '__snapshots__') continue;
    if (isRouteSegmentException(segment)) continue;

    if (isAppRouterPath && segment.startsWith('_')) {
      const tail = segment.slice(1);
      if (!(isKebabCase(tail) || isCamelCase(tail))) {
        addError(filePath, `invalid private folder "${segment}" (expected _kebab-case or _camelCase)`);
      }
      continue;
    }

    if (!isKebabCase(segment)) {
      addError(filePath, `invalid folder "${segment}" (expected kebab-case)`);
    }
  }
}

function validateServiceFile(baseName, filePath) {
  const serviceTestMatch = baseName.match(/^([a-z0-9-]+)\.service\.test\.ts$/);
  if (serviceTestMatch) {
    if (!isKebabCase(serviceTestMatch[1])) {
      addError(filePath, 'service test prefix must be kebab-case');
    }
    return true;
  }

  const serviceMatch = baseName.match(/^([a-z0-9-]+)\.service\.ts$/);
  if (serviceMatch) {
    if (!isKebabCase(serviceMatch[1])) {
      addError(filePath, 'service prefix must be kebab-case');
    }
    return true;
  }

  return false;
}

const trackedFiles = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

for (const filePath of trackedFiles) {
  if (!(filePath.startsWith('apps/') || filePath.startsWith('packages/'))) continue;
  if (!filePath.includes('/src/')) continue;

  if (
    filePath.includes('/node_modules/') ||
    filePath.includes('/dist/') ||
    filePath.includes('/build/') ||
    filePath.includes('/generated/')
  ) {
    continue;
  }

  if (filePath.startsWith('packages/db/prisma/migrations/')) continue;

  validateFolderSegments(filePath);

  const baseName = path.basename(filePath);
  if (RESERVED_NEXT_FILES.has(baseName)) continue;

  if (filePath.startsWith('apps/web/src/components/ui/')) continue;

  if (!baseName.endsWith('.ts') && !baseName.endsWith('.tsx')) continue;
  if (baseName.endsWith('.d.ts')) continue;

  if (filePath.startsWith('apps/web/src/services/')) {
    if (validateServiceFile(baseName, filePath)) continue;
  }

  const stem = baseName.replace(/\.(ts|tsx)$/, '');
  const { core } = splitStemAndSuffix(stem);

  if (baseName.endsWith('.tsx')) {
    if (!isPascalCase(core)) {
      addError(filePath, `invalid TSX filename "${baseName}" (expected PascalCase)`);
    }
    continue;
  }

  if (!isCamelCase(core)) {
    addError(filePath, `invalid TS filename "${baseName}" (expected camelCase)`);
  }
}

if (errors.length > 0) {
  console.error('Naming check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error(`\nTotal violations: ${errors.length}`);
  process.exit(1);
}

console.log('Naming check passed');

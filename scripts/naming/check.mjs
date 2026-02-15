#!/usr/bin/env node
/**
 * Folder naming guard that complements Biome's filename lint rule.
 *
 * Scope:
 * - apps/<app>/src/**
 * - packages/<pkg>/src/**
 *
 * Rules:
 * - folders: kebab-case
 *
 * Exceptions:
 * - __tests__, __snapshots__ folders
 * - route segment folders in app router: [id], (group), @slot
 * - app router private folders: _components, _hooks, _lib
 *   (tail must be kebab-case or camelCase)
 */

import { execSync } from 'node:child_process';
import path from 'node:path';

const errors = [];

function isKebabCase(input) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input);
}

function isCamelCase(input) {
  return /^[a-z][A-Za-z0-9]*$/.test(input);
}

function isRouteSegmentException(segment) {
  if (segment.startsWith('@')) return true;
  if (/^\(.*\)$/.test(segment)) return true;
  if (/^\[.*\]$/.test(segment)) return true;
  return false;
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
    if (isAppRouterPath && isRouteSegmentException(segment)) continue;

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

function validateServiceSuffix(filePath) {
  if (!filePath.startsWith('apps/web/src/services/')) return;
  if (!filePath.endsWith('.ts') || filePath.endsWith('.d.ts')) return;

  const baseName = path.basename(filePath);
  const ok = /^[a-z0-9]+(?:-[a-z0-9]+)*\.service(?:\.test)?\.ts$/.test(baseName);
  if (!ok) {
    addError(filePath, 'invalid service filename (expected kebab-case + .service(.test).ts)');
  }
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
  validateServiceSuffix(filePath);

  const baseName = path.basename(filePath);
  if (!baseName) continue;
}

if (errors.length > 0) {
  console.error('Naming check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  console.error(`\nTotal violations: ${errors.length}`);
  process.exit(1);
}

console.log('Folder naming check passed');

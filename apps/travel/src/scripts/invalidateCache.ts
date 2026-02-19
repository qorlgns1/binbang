#!/usr/bin/env node

import { closeRedisConnection } from '../lib/redis';
import {
  deleteCachedData,
  invalidateCachePattern,
  invalidateCacheTarget,
  type CacheInvalidationTarget,
} from '../services/cache.service';

type CliTarget = CacheInvalidationTarget | 'all';

const CACHE_TARGETS: CacheInvalidationTarget[] = ['places', 'weather', 'exchange'];

function printUsage(): void {
  console.log('Usage: pnpm --filter @workspace/travel invalidate-cache [options]');
  console.log('');
  console.log('Options:');
  console.log('  --target <all|places|weather|exchange>   Invalidate by logical target (default: all)');
  console.log('  --pattern <redis-pattern>                Invalidate with custom Redis pattern');
  console.log('  --key <redis-key>                        Delete one cache key');
  console.log('  -h, --help                               Show this help');
}

function readArg(args: string[], name: string): string | null {
  const inlinePrefix = `${name}=`;
  const inlineArg = args.find((arg) => arg.startsWith(inlinePrefix));
  if (inlineArg) {
    return inlineArg.slice(inlinePrefix.length);
  }

  const index = args.indexOf(name);
  if (index === -1) return null;

  const value = args[index + 1];
  if (!value || value.startsWith('--')) return null;
  return value;
}

function isCacheTarget(value: string): value is CacheInvalidationTarget {
  return CACHE_TARGETS.includes(value as CacheInvalidationTarget);
}

async function invalidateByTarget(target: CliTarget): Promise<number> {
  if (target === 'all') {
    let total = 0;
    for (const unit of CACHE_TARGETS) {
      const deleted = await invalidateCacheTarget(unit);
      total += deleted;
      console.log(`[invalidate-cache] target=${unit} deleted=${deleted}`);
    }
    return total;
  }

  const deleted = await invalidateCacheTarget(target);
  console.log(`[invalidate-cache] target=${target} deleted=${deleted}`);
  return deleted;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('-h') || args.includes('--help')) {
    printUsage();
    return;
  }

  const key = readArg(args, '--key');
  const pattern = readArg(args, '--pattern');
  const targetInput = (readArg(args, '--target') ?? 'all').toLowerCase();

  const modeCount = Number(Boolean(key)) + Number(Boolean(pattern));
  if (modeCount > 1) {
    throw new Error('Use only one mode: --target OR --pattern OR --key');
  }

  if (key) {
    await deleteCachedData(key);
    console.log(`[invalidate-cache] key=${key} deleted`);
    return;
  }

  if (pattern) {
    const deleted = await invalidateCachePattern(pattern);
    console.log(`[invalidate-cache] pattern=${pattern} deleted=${deleted}`);
    return;
  }

  if (targetInput !== 'all' && !isCacheTarget(targetInput)) {
    throw new Error(`Invalid --target value: ${targetInput}`);
  }

  const deleted = await invalidateByTarget(targetInput as CliTarget);
  console.log(`[invalidate-cache] total_deleted=${deleted}`);
}

main()
  .catch((error) => {
    console.error('[invalidate-cache] failed:', error);
    printUsage();
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeRedisConnection();
  });

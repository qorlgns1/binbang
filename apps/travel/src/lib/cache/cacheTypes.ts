export interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

export interface CachedFetchOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  freshTtlSeconds?: number;
  staleTtlSeconds?: number;
  jitterRatio?: number;
  lockTtlSeconds?: number;
  waitTimeoutMs?: number;
  waitIntervalMs?: number;
  logLabel?: string;
}

export interface CacheEnvelope<T> {
  value: T;
  expiresAt: number;
  staleUntil: number;
  updatedAt: number;
}

export type CacheReadResult<T> = { status: 'miss' } | { status: 'fresh'; value: T } | { status: 'stale'; value: T };
export type CacheEntryState = CacheReadResult<unknown>['status'];

export interface InternalReadOptions {
  label: string;
  log?: boolean;
}

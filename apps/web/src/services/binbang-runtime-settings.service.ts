import { prisma } from '@workspace/db';

const CACHE_TTL_MS = 60_000;

const DEFAULTS = {
  pollIntervalMinutes: 30,
  duePollLimit: 20,
  duePollConcurrency: 3,
  priceDropThreshold: 0.1,
  vacancyCooldownHours: 24,
  priceDropCooldownHours: 6,
  snapshotRetentionDays: 30,
  notificationDispatchLimit: 50,
  notificationMaxAttempts: 5,
  emailProvider: 'console' as const,
  fromEmail: 'Binbang <no-reply@binbang.local>',
};

export const BINBANG_SETTING_KEYS = {
  pollIntervalMinutes: 'binbang.pollIntervalMinutes',
  duePollLimit: 'binbang.duePollLimit',
  duePollConcurrency: 'binbang.duePollConcurrency',
  priceDropThreshold: 'binbang.priceDropThreshold',
  vacancyCooldownHours: 'binbang.vacancyCooldownHours',
  priceDropCooldownHours: 'binbang.priceDropCooldownHours',
  snapshotRetentionDays: 'binbang.snapshotRetentionDays',
  notificationDispatchLimit: 'binbang.notificationDispatchLimit',
  notificationMaxAttempts: 'binbang.notificationMaxAttempts',
  emailProvider: 'binbang.emailProvider',
  fromEmail: 'binbang.fromEmail',
} as const;

type BinbangSettingKey = (typeof BINBANG_SETTING_KEYS)[keyof typeof BINBANG_SETTING_KEYS];

export interface BinbangRuntimeSettings {
  pollIntervalMinutes: number;
  duePollLimit: number;
  duePollConcurrency: number;
  priceDropThreshold: number;
  vacancyCooldownHours: number;
  priceDropCooldownHours: number;
  snapshotRetentionDays: number;
  notificationDispatchLimit: number;
  notificationMaxAttempts: number;
  emailProvider: 'console' | 'resend';
  fromEmail: string;
}

let cachedSettings: { loadedAt: number; value: BinbangRuntimeSettings } | null = null;

function shouldUseCache(): boolean {
  return process.env.NODE_ENV !== 'test';
}

function parsePositiveInteger(value: string | undefined, fallbackValue: number): number {
  if (!value) return fallbackValue;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackValue;
  return parsed;
}

function parsePositiveRatio(value: string | undefined, fallbackValue: number): number {
  if (!value) return fallbackValue;
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed >= 1) return fallbackValue;
  return parsed;
}

function normalizeEmailProvider(value: string | undefined): 'console' | 'resend' {
  return value?.trim().toLowerCase() === 'resend' ? 'resend' : 'console';
}

function buildEnvFallback(): BinbangRuntimeSettings {
  return {
    pollIntervalMinutes: parsePositiveInteger(
      process.env.BINBANG_POLL_INTERVAL_MINUTES,
      DEFAULTS.pollIntervalMinutes,
    ),
    duePollLimit: parsePositiveInteger(process.env.BINBANG_DUE_POLL_LIMIT, DEFAULTS.duePollLimit),
    duePollConcurrency: parsePositiveInteger(
      process.env.BINBANG_DUE_POLL_CONCURRENCY,
      DEFAULTS.duePollConcurrency,
    ),
    priceDropThreshold: parsePositiveRatio(process.env.BINBANG_PRICE_DROP_THRESHOLD, DEFAULTS.priceDropThreshold),
    vacancyCooldownHours: parsePositiveInteger(
      process.env.BINBANG_VACANCY_COOLDOWN_HOURS,
      DEFAULTS.vacancyCooldownHours,
    ),
    priceDropCooldownHours: parsePositiveInteger(
      process.env.BINBANG_PRICE_DROP_COOLDOWN_HOURS,
      DEFAULTS.priceDropCooldownHours,
    ),
    snapshotRetentionDays: parsePositiveInteger(
      process.env.BINBANG_SNAPSHOT_RETENTION_DAYS,
      DEFAULTS.snapshotRetentionDays,
    ),
    notificationDispatchLimit: parsePositiveInteger(
      process.env.BINBANG_NOTIFICATION_DISPATCH_LIMIT,
      DEFAULTS.notificationDispatchLimit,
    ),
    notificationMaxAttempts: parsePositiveInteger(
      process.env.BINBANG_NOTIFICATION_MAX_ATTEMPTS,
      DEFAULTS.notificationMaxAttempts,
    ),
    emailProvider: normalizeEmailProvider(process.env.BINBANG_EMAIL_PROVIDER),
    fromEmail: process.env.BINBANG_FROM_EMAIL?.trim() || DEFAULTS.fromEmail,
  };
}

function readSetting(map: Map<string, string>, key: BinbangSettingKey): string | undefined {
  const value = map.get(key);
  if (value == null) return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function applyDbOverrides(base: BinbangRuntimeSettings, map: Map<string, string>): BinbangRuntimeSettings {
  return {
    pollIntervalMinutes: parsePositiveInteger(
      readSetting(map, BINBANG_SETTING_KEYS.pollIntervalMinutes),
      base.pollIntervalMinutes,
    ),
    duePollLimit: parsePositiveInteger(readSetting(map, BINBANG_SETTING_KEYS.duePollLimit), base.duePollLimit),
    duePollConcurrency: parsePositiveInteger(
      readSetting(map, BINBANG_SETTING_KEYS.duePollConcurrency),
      base.duePollConcurrency,
    ),
    priceDropThreshold: parsePositiveRatio(
      readSetting(map, BINBANG_SETTING_KEYS.priceDropThreshold),
      base.priceDropThreshold,
    ),
    vacancyCooldownHours: parsePositiveInteger(
      readSetting(map, BINBANG_SETTING_KEYS.vacancyCooldownHours),
      base.vacancyCooldownHours,
    ),
    priceDropCooldownHours: parsePositiveInteger(
      readSetting(map, BINBANG_SETTING_KEYS.priceDropCooldownHours),
      base.priceDropCooldownHours,
    ),
    snapshotRetentionDays: parsePositiveInteger(
      readSetting(map, BINBANG_SETTING_KEYS.snapshotRetentionDays),
      base.snapshotRetentionDays,
    ),
    notificationDispatchLimit: parsePositiveInteger(
      readSetting(map, BINBANG_SETTING_KEYS.notificationDispatchLimit),
      base.notificationDispatchLimit,
    ),
    notificationMaxAttempts: parsePositiveInteger(
      readSetting(map, BINBANG_SETTING_KEYS.notificationMaxAttempts),
      base.notificationMaxAttempts,
    ),
    emailProvider: normalizeEmailProvider(readSetting(map, BINBANG_SETTING_KEYS.emailProvider) ?? base.emailProvider),
    fromEmail: readSetting(map, BINBANG_SETTING_KEYS.fromEmail) ?? base.fromEmail,
  };
}

async function readDbSettingsMap(): Promise<Map<string, string>> {
  const client = (
    prisma as unknown as {
      systemSettings?: {
        findMany?: (args: {
          where: { key: { in: string[] } };
          select: { key: true; value: true };
        }) => Promise<Array<{ key: string; value: string }>>;
      };
    }
  ).systemSettings;

  if (!client || typeof client.findMany !== 'function') {
    return new Map();
  }

  try {
    const rows = await client.findMany({
      where: { key: { in: Object.values(BINBANG_SETTING_KEYS) } },
      select: { key: true, value: true },
    });
    return new Map(rows.map((row) => [row.key, row.value]));
  } catch {
    return new Map();
  }
}

export function clearBinbangRuntimeSettingsCache(): void {
  cachedSettings = null;
}

export async function getBinbangRuntimeSettings(force = false): Promise<BinbangRuntimeSettings> {
  if (shouldUseCache() && !force && cachedSettings && Date.now() - cachedSettings.loadedAt < CACHE_TTL_MS) {
    return cachedSettings.value;
  }

  const envFallback = buildEnvFallback();
  const map = await readDbSettingsMap();
  const value = applyDbOverrides(envFallback, map);

  if (shouldUseCache()) {
    cachedSettings = {
      loadedAt: Date.now(),
      value,
    };
  }

  return value;
}

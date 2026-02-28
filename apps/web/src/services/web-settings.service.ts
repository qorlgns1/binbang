/**
 * Web app 모니터링/하트비트 설정 서비스
 *
 * DB(SystemSettings) 우선 + env fallback 방식으로 운영 설정을 조회한다.
 * binbang-runtime-settings.service.ts 와 동일한 패턴 적용.
 */

import { prisma } from '@workspace/db';

import type { WebSettingsCache } from '@/lib/settings';

// ============================================================================
// Constants
// ============================================================================

const CACHE_TTL_MS = 5 * 60 * 1000; // 5분

export const WEB_SETTING_KEYS = {
  workerHealthyThresholdMs: 'monitoring.workerHealthyThresholdMs',
  workerDegradedThresholdMs: 'monitoring.workerDegradedThresholdMs',
  heartbeatIntervalMs: 'heartbeat.intervalMs',
  heartbeatMissedThreshold: 'heartbeat.missedThreshold',
} as const;

type WebSettingKey = (typeof WEB_SETTING_KEYS)[keyof typeof WEB_SETTING_KEYS];

const DEFAULTS: Record<WebSettingKey, { env: string; default: number }> = {
  'monitoring.workerHealthyThresholdMs': {
    env: 'WORKER_HEALTHY_THRESHOLD_MS',
    default: 2_400_000,
  },
  'monitoring.workerDegradedThresholdMs': {
    env: 'WORKER_DEGRADED_THRESHOLD_MS',
    default: 5_400_000,
  },
  'heartbeat.intervalMs': {
    env: 'HEARTBEAT_INTERVAL_MS',
    default: 60_000,
  },
  'heartbeat.missedThreshold': {
    env: 'HEARTBEAT_MISSED_THRESHOLD',
    default: 1,
  },
};

// ============================================================================
// Internal
// ============================================================================

let cachedSettings: { loadedAt: number; value: WebSettingsCache } | null = null;

function shouldUseCache(): boolean {
  return process.env.NODE_ENV !== 'test';
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function resolveInt(key: WebSettingKey, dbMap: Map<string, string>): number {
  const dbValue = dbMap.get(key);
  if (dbValue !== undefined && dbValue !== '') {
    return parsePositiveInteger(dbValue, DEFAULTS[key].default);
  }

  const envValue = process.env[DEFAULTS[key].env];
  if (envValue !== undefined) {
    return parsePositiveInteger(envValue, DEFAULTS[key].default);
  }

  return DEFAULTS[key].default;
}

function buildSettings(dbMap: Map<string, string>): WebSettingsCache {
  return {
    monitoring: {
      workerHealthyThresholdMs: resolveInt('monitoring.workerHealthyThresholdMs', dbMap),
      workerDegradedThresholdMs: resolveInt('monitoring.workerDegradedThresholdMs', dbMap),
    },
    heartbeat: {
      intervalMs: resolveInt('heartbeat.intervalMs', dbMap),
      missedThreshold: resolveInt('heartbeat.missedThreshold', dbMap),
    },
  };
}

async function readDbSettingsMap(): Promise<Map<string, string>> {
  try {
    const rows = await prisma.systemSettings.findMany({
      where: { key: { in: Object.values(WEB_SETTING_KEYS) } },
      select: { key: true, value: true },
    });
    return new Map(rows.map((row) => [row.key, row.value]));
  } catch {
    return new Map();
  }
}

// ============================================================================
// Public API
// ============================================================================

export function clearWebSettingsCache(): void {
  cachedSettings = null;
}

/**
 * DB에서 모니터링/하트비트 설정을 로드하여 캐시에 저장한다.
 * DB 접근 실패 시 env/기본값으로 폴백한다.
 */
export async function loadWebSettings(force = false): Promise<WebSettingsCache> {
  if (shouldUseCache() && !force && cachedSettings && Date.now() - cachedSettings.loadedAt < CACHE_TTL_MS) {
    return cachedSettings.value;
  }

  const dbMap = await readDbSettingsMap();
  const value = buildSettings(dbMap);

  if (shouldUseCache()) {
    cachedSettings = { loadedAt: Date.now(), value };
  }

  return value;
}

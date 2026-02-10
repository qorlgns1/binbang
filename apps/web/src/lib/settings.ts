/**
 * Settings utilities for web app
 * Simplified version that only uses environment variables (no DB caching)
 * For full DB-backed settings, use @workspace/worker-shared/runtime in apps/worker
 */

interface MonitoringSettings {
  workerHealthyThresholdMs: number;
  workerDegradedThresholdMs: number;
}

interface HeartbeatSettings {
  intervalMs: number;
  missedThreshold: number;
}

export interface WebSettingsCache {
  monitoring: MonitoringSettings;
  heartbeat: HeartbeatSettings;
}

function toInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

/**
 * Web app settings from environment variables only
 */
export function getSettings(): WebSettingsCache {
  return {
    monitoring: {
      workerHealthyThresholdMs: toInt(process.env.WORKER_HEALTHY_THRESHOLD_MS, 2400000),
      workerDegradedThresholdMs: toInt(process.env.WORKER_DEGRADED_THRESHOLD_MS, 5400000),
    },
    heartbeat: {
      intervalMs: toInt(process.env.HEARTBEAT_INTERVAL_MS, 60000),
      missedThreshold: toInt(process.env.HEARTBEAT_MISSED_THRESHOLD, 1),
    },
  };
}

/**
 * For web, loadSettings is synchronous (no DB access)
 */
export async function loadSettings(): Promise<WebSettingsCache> {
  return getSettings();
}

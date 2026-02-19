import dotenv from 'dotenv';

dotenv.config();

/**
 * 환경변수 검증 유틸리티
 * 앱 시작 시 필수 환경변수가 설정되어 있는지 확인
 */

const WEB_REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'KAKAO_CLIENT_ID',
  'KAKAO_CLIENT_SECRET',
] as const;

const WORKER_REQUIRED_ENV_VARS = ['DATABASE_URL', 'REDIS_URL'] as const;

/**
 * 웹 앱용 환경변수 검증
 */
export function validateWebEnv(): void {
  validateEnvVars(WEB_REQUIRED_ENV_VARS, '웹 앱');
}

/**
 * 워커용 환경변수 검증
 */
export function validateWorkerEnv(): void {
  validateEnvVars(WORKER_REQUIRED_ENV_VARS, '워커');
}

/**
 * 공통 검증 로직
 */
function validateEnvVars(keys: readonly string[], context: string): void {
  const missing = keys.filter((key): boolean => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ ${context} 필수 환경변수가 설정되지 않았습니다:\n` +
        missing.map((key): string => `   - ${key}`).join('\n') +
        `\n\n.env 파일을 확인하세요.`,
    );
  }
}

/**
 * 환경변수 안전하게 가져오기 (기본값 지원)
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`환경변수 ${key}가 설정되지 않았습니다.`);
  }
  return value;
}

/**
 * 숫자형 환경변수 가져오기
 */
export function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    console.warn(`⚠️ ${key}의 값 "${value}"이 숫자가 아닙니다. 기본값 ${defaultValue} 사용`);
    return defaultValue;
  }
  return parsed;
}

/**
 * 이메일 전송(Resend)용 설정. 둘 다 있을 때만 반환한다.
 * observability는 env에 직접 접근하지 않으므로, runtime에서 이 값을 읽어 sendEmailHttp에 전달한다.
 */
export function getEmailConfig(): { apiKey: string; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey?.trim() || !from?.trim()) return null;
  return { apiKey: apiKey.trim(), from: from.trim() };
}

export interface AffiliateAuditTelegramConfig {
  botToken: string | null;
  criticalChatId: string | null;
  warningChatId: string | null;
  criticalThreadId: string | null;
  warningThreadId: string | null;
}

export interface AffiliateAuditPurgeConfig {
  cronSchedule: string;
  cronWatchdogSchedule: string;
  retentionDays: number;
  retryMax: number;
  retryBackoffSeconds: number;
  dedupeWindowSeconds: number;
  recoveryEnabled: boolean;
  cronMissThresholdMinutes: number;
  runStartedRedisKeyPrefix: string;
  telegram: AffiliateAuditTelegramConfig;
}

export interface TravelCachePrewarmConfig {
  internalUrl: string;
  cronSchedule: string;
  timeoutMs: number;
  cronToken: string | null;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') return false;
  return fallback;
}

function readOptionalEnv(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getAffiliateAuditPurgeConfig(): AffiliateAuditPurgeConfig {
  return {
    cronSchedule: process.env.AFFILIATE_AUDIT_PURGE_CRON?.trim() || '10 3 * * *',
    cronWatchdogSchedule: process.env.AFFILIATE_AUDIT_PURGE_CRON_WATCHDOG?.trim() || '*/15 * * * *',
    retentionDays: parsePositiveInt(process.env.AFFILIATE_AUDIT_RETENTION_DAYS, 365),
    retryMax: parsePositiveInt(process.env.AFFILIATE_AUDIT_PURGE_RETRY_MAX, 3),
    retryBackoffSeconds: parsePositiveInt(process.env.AFFILIATE_AUDIT_PURGE_RETRY_BACKOFF_SECONDS, 10),
    dedupeWindowSeconds: parsePositiveInt(process.env.AFFILIATE_AUDIT_ALERT_DEDUPE_WINDOW_SECONDS, 86400),
    recoveryEnabled: parseBoolean(process.env.AFFILIATE_AUDIT_ALERT_RECOVERY_ENABLED, true),
    cronMissThresholdMinutes: parsePositiveInt(process.env.AFFILIATE_AUDIT_PURGE_CRON_MISS_THRESHOLD_MINUTES, 90),
    runStartedRedisKeyPrefix:
      process.env.AFFILIATE_RUN_STARTED_REDIS_KEY_PREFIX?.trim() || 'affiliate:audit:run_started',
    telegram: {
      botToken: readOptionalEnv(process.env.AFFILIATE_AUDIT_ALERT_TELEGRAM_BOT_TOKEN),
      criticalChatId: readOptionalEnv(process.env.AFFILIATE_AUDIT_ALERT_TELEGRAM_CRITICAL_CHAT_ID),
      warningChatId: readOptionalEnv(process.env.AFFILIATE_AUDIT_ALERT_TELEGRAM_WARNING_CHAT_ID),
      criticalThreadId: readOptionalEnv(process.env.AFFILIATE_AUDIT_ALERT_TELEGRAM_CRITICAL_THREAD_ID),
      warningThreadId: readOptionalEnv(process.env.AFFILIATE_AUDIT_ALERT_TELEGRAM_WARNING_THREAD_ID),
    },
  };
}

export function getTravelCachePrewarmConfig(): TravelCachePrewarmConfig {
  return {
    internalUrl: process.env.TRAVEL_INTERNAL_URL?.trim() || 'http://localhost:3300',
    cronSchedule: process.env.TRAVEL_CACHE_PREWARM_CRON?.trim() || '20 */6 * * *',
    timeoutMs: parsePositiveInt(process.env.TRAVEL_CACHE_PREWARM_TIMEOUT_MS, 120000),
    cronToken: readOptionalEnv(process.env.TRAVEL_INTERNAL_CRON_TOKEN),
  };
}

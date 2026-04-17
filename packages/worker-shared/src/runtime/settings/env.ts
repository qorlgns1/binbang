import dotenv from 'dotenv';

dotenv.config();

/**
 * 환경변수 검증 유틸리티
 * 앱 시작 시 필수 환경변수가 설정되어 있는지 확인
 */

interface EnvRule {
  key: string;
  required?: boolean;
  validate?: (value: string) => string | null;
}

const HTTP_PROTOCOLS = new Set(['http:', 'https:']);
const ORACLE_CONNECT_PROTOCOLS = new Set(['tcp:', 'tcps:']);
const REDIS_PROTOCOLS = new Set(['redis:', 'rediss:']);

const WEB_ENV_RULES = [
  { key: 'ORACLE_USER' },
  { key: 'ORACLE_PASSWORD' },
  { key: 'ORACLE_CONNECT_STRING', validate: (value): string | null => validateUrl(value, ORACLE_CONNECT_PROTOCOLS) },
  { key: 'NEXTAUTH_URL', validate: (value): string | null => validateUrl(value, HTTP_PROTOCOLS) },
  { key: 'NEXTAUTH_SECRET' },
  { key: 'GOOGLE_CLIENT_ID' },
  { key: 'GOOGLE_CLIENT_SECRET' },
  { key: 'KAKAO_CLIENT_ID' },
  { key: 'KAKAO_CLIENT_SECRET' },
] as const satisfies readonly EnvRule[];

const WORKER_ENV_RULES = [
  { key: 'ORACLE_USER' },
  { key: 'ORACLE_PASSWORD' },
  { key: 'ORACLE_CONNECT_STRING', validate: (value): string | null => validateUrl(value, ORACLE_CONNECT_PROTOCOLS) },
  { key: 'REDIS_URL', validate: (value): string | null => validateUrl(value, REDIS_PROTOCOLS) },
] as const satisfies readonly EnvRule[];

/**
 * 웹 앱용 환경변수 검증
 */
export function validateWebEnv(): void {
  validateEnvRules(WEB_ENV_RULES, '웹 앱');
}

/**
 * 워커용 환경변수 검증
 */
export function validateWorkerEnv(): void {
  validateEnvRules(WORKER_ENV_RULES, '워커');
}

function readEnvValue(key: string): string | undefined {
  const trimmed = process.env[key]?.trim();
  return trimmed ? trimmed : undefined;
}

function validateUrl(value: string, allowedProtocols: ReadonlySet<string>): string | null {
  try {
    const parsed = new URL(value);
    if (!allowedProtocols.has(parsed.protocol)) {
      return `허용되지 않은 URL scheme입니다 (${parsed.protocol})`;
    }
    return null;
  } catch {
    return '유효한 URL이 아닙니다.';
  }
}

/**
 * 공통 검증 로직
 */
function validateEnvRules(rules: readonly EnvRule[], context: string): void {
  const issues: string[] = [];

  for (const rule of rules) {
    const value = readEnvValue(rule.key);

    if (!value) {
      if (rule.required !== false) {
        issues.push(`   - ${rule.key}: 값이 비어 있습니다.`);
      }
      continue;
    }

    const reason = rule.validate?.(value);
    if (reason) {
      issues.push(`   - ${rule.key}: ${reason}`);
    }
  }

  if (issues.length > 0) {
    throw new Error(`❌ ${context} 환경변수 검증 실패:\n${issues.join('\n')}\n\n.env 파일을 확인하세요.`);
  }
}

/**
 * 환경변수 안전하게 가져오기 (기본값 지원)
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = readEnvValue(key);
  if (value !== undefined) {
    return value;
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`환경변수 ${key}가 설정되지 않았습니다.`);
}

/**
 * 숫자형 환경변수 가져오기
 */
export function getEnvNumber(key: string, defaultValue: number): number {
  const value = readEnvValue(key);
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = Number.parseInt(value, 10);
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
  const apiKey = readEnvValue('RESEND_API_KEY');
  const from = readEnvValue('EMAIL_FROM');
  if (!apiKey || !from) return null;
  return { apiKey, from };
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

function getValidatedUrlEnv(key: string, defaultValue: string, allowedProtocols: ReadonlySet<string>): string {
  const raw = process.env[key];
  if (raw === undefined) {
    return defaultValue;
  }
  const value = raw.trim();
  if (value.length === 0) {
    throw new Error(`환경변수 ${key}가 비어 있습니다.`);
  }
  const reason = validateUrl(value, allowedProtocols);
  if (reason) {
    throw new Error(`환경변수 ${key}가 올바르지 않습니다: ${reason}`);
  }
  return value;
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
    internalUrl: getValidatedUrlEnv('TRAVEL_INTERNAL_URL', 'http://localhost:3300', HTTP_PROTOCOLS),
    cronSchedule: process.env.TRAVEL_CACHE_PREWARM_CRON?.trim() || '20 */6 * * *',
    timeoutMs: parsePositiveInt(process.env.TRAVEL_CACHE_PREWARM_TIMEOUT_MS, 120000),
    cronToken: readOptionalEnv(process.env.TRAVEL_INTERNAL_CRON_TOKEN),
  };
}

export interface BinbangCronConfig {
  webInternalUrl: string;
  internalApiToken: string | null;
  pollDueCron: string;
  dispatchCron: string;
  snapshotCleanupCron: string;
  timeoutMs: number;
}

export function getBinbangCronConfig(): BinbangCronConfig {
  return {
    webInternalUrl: getValidatedUrlEnv('WEB_INTERNAL_URL', 'http://localhost:3000', HTTP_PROTOCOLS),
    internalApiToken: readOptionalEnv(process.env.BINBANG_INTERNAL_API_TOKEN),
    pollDueCron: process.env.BINBANG_POLL_DUE_CRON?.trim() || '*/30 * * * *',
    dispatchCron: process.env.BINBANG_DISPATCH_CRON?.trim() || '*/5 * * * *',
    snapshotCleanupCron: process.env.BINBANG_SNAPSHOT_CLEANUP_CRON?.trim() || '0 3 * * *',
    timeoutMs: parsePositiveInt(process.env.BINBANG_CRON_TIMEOUT_MS, 120_000),
  };
}

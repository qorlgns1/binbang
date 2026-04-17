/**
 * Environment variable utilities for web app
 * Local implementation - does not import from @workspace/worker-shared
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
  {
    key: 'NEXT_PUBLIC_APP_URL',
    required: false,
    validate: (value): string | null => validateUrl(value, HTTP_PROTOCOLS),
  },
  {
    key: 'WORKER_INTERNAL_URL',
    required: false,
    validate: (value): string | null => validateUrl(value, HTTP_PROTOCOLS),
  },
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

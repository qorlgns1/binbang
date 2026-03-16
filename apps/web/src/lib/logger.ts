type LogLevel = 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

function createEntropy(): string {
  return Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
}

export function createRequestId(prefix = 'req'): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14);
  return `${prefix}_${timestamp}_${createEntropy()}`;
}

export function logInfo(event: string, context: LogContext = {}): void {
  writeLog('info', event, context);
}

export function logWarn(event: string, context: LogContext = {}): void {
  writeLog('warn', event, context);
}

export function logError(event: string, context: LogContext = {}): void {
  writeLog('error', event, context);
}

function writeLog(level: LogLevel, event: string, context: LogContext): void {
  const payload = {
    ts: new Date().toISOString(),
    app: 'binbang-web',
    level,
    event,
    ...normalizeRecord(context),
  };
  const serialized = JSON.stringify(payload);

  if (level === 'error') {
    console.error(serialized);
    return;
  }
  if (level === 'warn') {
    console.warn(serialized);
    return;
  }
  console.info(serialized);
}

function normalizeRecord(value: LogContext): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalizeValue(entry)]));
}

function normalizeValue(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack ?? null,
    };
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, normalizeValue(entry)]),
    );
  }

  return value;
}

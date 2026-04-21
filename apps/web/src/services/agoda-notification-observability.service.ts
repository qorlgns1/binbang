export type AgodaNotificationTerminalStatus = 'failed' | 'suppressed';

export type AgodaNotificationReasonCode =
  | 'FAILED_EMAIL_SEND'
  | 'FAILED_STALE_PROCESSING_MAX_ATTEMPTS'
  | 'SUPPRESSED_ACCOMMODATION_INACTIVE'
  | 'SUPPRESSED_MISSING_RECIPIENT_EMAIL'
  | 'SUPPRESSED_MISSING_OPT_IN_CONSENT'
  | 'SUPPRESSED_UNKNOWN'
  | 'UNKNOWN';

export interface ParsedAgodaNotificationReason {
  code: AgodaNotificationReasonCode;
  label: string;
  message: string | null;
  raw: string | null;
}

export interface AgodaNotificationReasonStat {
  code: AgodaNotificationReasonCode;
  label: string;
  count: number;
}

export interface AgodaNotificationReasonBreakdown {
  failed: AgodaNotificationReasonStat[];
  suppressed: AgodaNotificationReasonStat[];
}

interface ReasonAggregateRow {
  status: string;
  lastError: string | null;
  count: number;
}

const REASON_SEPARATOR = '::';

const LEGACY_REASON_TO_CODE: Record<string, AgodaNotificationReasonCode> = {
  'accommodation is missing or inactive': 'SUPPRESSED_ACCOMMODATION_INACTIVE',
  'user email is missing': 'SUPPRESSED_MISSING_RECIPIENT_EMAIL',
  'no active consent (opt_in required)': 'SUPPRESSED_MISSING_OPT_IN_CONSENT',
  'stale processing recovered at max attempts': 'FAILED_STALE_PROCESSING_MAX_ATTEMPTS',
};

const REASON_LABELS: Record<AgodaNotificationReasonCode, string> = {
  FAILED_EMAIL_SEND: '이메일 전송 실패',
  FAILED_STALE_PROCESSING_MAX_ATTEMPTS: 'processing 상태 복구 중 최대 재시도 도달',
  SUPPRESSED_ACCOMMODATION_INACTIVE: '비활성 또는 누락된 숙소',
  SUPPRESSED_MISSING_RECIPIENT_EMAIL: '수신자 이메일 없음',
  SUPPRESSED_MISSING_OPT_IN_CONSENT: '수신 동의 없음',
  SUPPRESSED_UNKNOWN: '억제 사유 미분류',
  UNKNOWN: '미분류',
};

export function encodeAgodaNotificationReason(code: AgodaNotificationReasonCode, message: string): string {
  const normalizedMessage = message.trim().replace(/\s+/g, ' ');
  return normalizedMessage.length > 0 ? `${code}${REASON_SEPARATOR}${normalizedMessage}` : code;
}

export function parseAgodaNotificationReason(
  raw: string | null | undefined,
  status?: string | null,
): ParsedAgodaNotificationReason {
  const normalizedRaw = raw?.trim() || null;
  if (!normalizedRaw) {
    const code = inferReasonCodeFromStatus(status);
    return {
      code,
      label: getAgodaNotificationReasonLabel(code),
      message: null,
      raw: null,
    };
  }

  const separatorIndex = normalizedRaw.indexOf(REASON_SEPARATOR);
  if (separatorIndex > 0) {
    const rawCode = normalizedRaw.slice(0, separatorIndex).trim();
    const message = normalizedRaw.slice(separatorIndex + REASON_SEPARATOR.length).trim() || null;
    const code = isKnownReasonCode(rawCode) ? rawCode : inferReasonCodeFromStatus(status);
    return {
      code,
      label: getAgodaNotificationReasonLabel(code),
      message,
      raw: normalizedRaw,
    };
  }

  if (isKnownReasonCode(normalizedRaw)) {
    return {
      code: normalizedRaw,
      label: getAgodaNotificationReasonLabel(normalizedRaw),
      message: null,
      raw: normalizedRaw,
    };
  }

  const legacyCode = LEGACY_REASON_TO_CODE[normalizedRaw];
  if (legacyCode) {
    return {
      code: legacyCode,
      label: getAgodaNotificationReasonLabel(legacyCode),
      message: normalizedRaw,
      raw: normalizedRaw,
    };
  }

  const code = inferReasonCodeFromStatus(status);
  return {
    code,
    label: getAgodaNotificationReasonLabel(code),
    message: normalizedRaw,
    raw: normalizedRaw,
  };
}

export function getAgodaNotificationReasonLabel(code: AgodaNotificationReasonCode): string {
  return REASON_LABELS[code] ?? REASON_LABELS.UNKNOWN;
}

export function buildAgodaNotificationReasonBreakdown(
  rows: ReasonAggregateRow[],
  limitPerStatus = 3,
): AgodaNotificationReasonBreakdown {
  const grouped = {
    failed: new Map<AgodaNotificationReasonCode, number>(),
    suppressed: new Map<AgodaNotificationReasonCode, number>(),
  };

  for (const row of rows) {
    if (row.status !== 'failed' && row.status !== 'suppressed') {
      continue;
    }

    const parsed = parseAgodaNotificationReason(row.lastError, row.status);
    const current = grouped[row.status].get(parsed.code) ?? 0;
    grouped[row.status].set(parsed.code, current + row.count);
  }

  return {
    failed: mapReasonStats(grouped.failed, limitPerStatus),
    suppressed: mapReasonStats(grouped.suppressed, limitPerStatus),
  };
}

export function buildAgodaNotificationReasonBreakdownFromRows(
  rows: Array<Pick<ReasonAggregateRow, 'status' | 'lastError'>>,
  limitPerStatus = 3,
): AgodaNotificationReasonBreakdown {
  return buildAgodaNotificationReasonBreakdown(
    rows.map((row) => ({
      status: row.status,
      lastError: row.lastError,
      count: 1,
    })),
    limitPerStatus,
  );
}

function isKnownReasonCode(value: string): value is AgodaNotificationReasonCode {
  return value in REASON_LABELS;
}

function inferReasonCodeFromStatus(status?: string | null): AgodaNotificationReasonCode {
  if (status === 'failed') return 'FAILED_EMAIL_SEND';
  if (status === 'suppressed') return 'SUPPRESSED_UNKNOWN';
  return 'UNKNOWN';
}

function mapReasonStats(value: Map<AgodaNotificationReasonCode, number>, limit: number): AgodaNotificationReasonStat[] {
  return [...value.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([code, count]) => ({
      code,
      label: getAgodaNotificationReasonLabel(code),
      count,
    }));
}

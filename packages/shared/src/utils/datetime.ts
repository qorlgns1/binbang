export const KST_TIMEZONE = 'Asia/Seoul';

interface FormatDateTimeOptions {
  withTime?: boolean;
  locale?: string;
  timeZone?: string;
}

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((part): boolean => part.type === type)?.value ?? '';
}

function parseDate(value: Date | string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date value');
  }
  return date;
}

export function formatBrowserLocalDateTime(value: Date | string, options: FormatDateTimeOptions = {}): string {
  const { withTime = true, locale = 'ko-KR', timeZone } = options;
  const date = parseDate(value);

  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(withTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          hourCycle: 'h23',
        }
      : {}),
  });

  const parts = formatter.formatToParts(date);
  const year = getPart(parts, 'year');
  const month = getPart(parts, 'month');
  const day = getPart(parts, 'day');

  if (!withTime) {
    return `${year}-${month}-${day}`;
  }

  const hour = getPart(parts, 'hour');
  const minute = getPart(parts, 'minute');

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

export function formatKstDateTime(value: Date | string, options: Omit<FormatDateTimeOptions, 'timeZone'> = {}): string {
  return formatBrowserLocalDateTime(value, { ...options, timeZone: KST_TIMEZONE });
}

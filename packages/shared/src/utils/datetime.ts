import { format } from 'date-fns';
import { tz } from '@date-fns/tz';

interface FormatDateTimeOptions {
  withTime?: boolean;
  timeZone?: string;
}

function parseDate(value: Date | string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date value');
  }
  return date;
}

function buildFormat(withTime: boolean): string {
  return withTime ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd';
}

export function formatBrowserLocalDateTime(value: Date | string, options: FormatDateTimeOptions = {}): string {
  const { withTime = true, timeZone } = options;
  const date = parseDate(value);
  const fmt = buildFormat(withTime);
  return timeZone ? format(date, fmt, { in: tz(timeZone) }) : format(date, fmt);
}

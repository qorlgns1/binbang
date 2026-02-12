/**
 * i18n Core — Intl 기반 포맷 토큰 유틸
 *
 * 모든 포맷은 토큰(프리셋)을 통해서만 수행한다.
 * 동일 locale + 동일 토큰 입력 시 결정적 출력을 보장한다.
 *
 * 순수(universal) 코드. Node built-in/env/네트워크 I/O 금지.
 */
import type { Locale } from './locale';

// ── 기본값 ──

const DEFAULT_TIMEZONE = 'Asia/Seoul';

// ── 날짜 포맷 프리셋 ──

const datePresets = {
  /** 2026-02-12 */
  'date.short': { year: 'numeric', month: '2-digit', day: '2-digit' },
  /** 2026년 2월 12일 / February 12, 2026 */
  'date.long': { year: 'numeric', month: 'long', day: 'numeric' },
  /** 2026-02-12 22:30 */
  'dateTime.short': {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  },
  /** 2026년 2월 12일 오후 10:30:00 */
  'dateTime.long': {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

/** 날짜 포맷 토큰 */
export type DateToken = keyof typeof datePresets;

// ── 숫자 포맷 프리셋 ──

const numberPresets = {
  /** 1,234 */
  'number.standard': {},
  /** 1.2K / 1.2천 */
  'number.compact': { notation: 'compact' },
  /** 1,234.56 (소수점 2자리) */
  'number.precise': { minimumFractionDigits: 2, maximumFractionDigits: 2 },
} as const satisfies Record<string, Intl.NumberFormatOptions>;

/** 숫자 포맷 토큰 */
export type NumberToken = keyof typeof numberPresets;

// ── 통화 포맷 프리셋 ──

const currencyPresets = {
  /** ₩1,234 */
  'currency.krw': { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 },
  /** $1,234.00 */
  'currency.usd': { style: 'currency', currency: 'USD' },
  /** €1,234.00 */
  'currency.eur': { style: 'currency', currency: 'EUR' },
} as const satisfies Record<string, Intl.NumberFormatOptions>;

/** 통화 포맷 토큰 */
export type CurrencyToken = keyof typeof currencyPresets;

// ── 포맷 함수 ──

/**
 * 날짜를 토큰 프리셋으로 포맷한다.
 *
 * @param locale - 표시 locale
 * @param date - 포맷할 날짜
 * @param token - 포맷 프리셋 토큰
 * @param timeZone - 타임존 (기본: Asia/Seoul)
 */
export function formatDate(
  locale: Locale,
  date: Date,
  token: DateToken,
  timeZone: string = DEFAULT_TIMEZONE,
): string {
  const options = { ...datePresets[token], timeZone };
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * 숫자를 토큰 프리셋으로 포맷한다.
 *
 * @param locale - 표시 locale
 * @param value - 포맷할 숫자
 * @param token - 포맷 프리셋 토큰
 */
export function formatNumber(locale: Locale, value: number, token: NumberToken = 'number.standard'): string {
  return new Intl.NumberFormat(locale, numberPresets[token]).format(value);
}

/**
 * 통화를 토큰 프리셋으로 포맷한다.
 *
 * @param locale - 표시 locale
 * @param value - 포맷할 금액
 * @param token - 통화 프리셋 토큰
 */
export function formatCurrency(locale: Locale, value: number, token: CurrencyToken): string {
  return new Intl.NumberFormat(locale, currencyPresets[token]).format(value);
}

/**
 * 상대시간을 포맷한다.
 *
 * @param locale - 표시 locale
 * @param value - 상대값 (음수: 과거, 양수: 미래)
 * @param unit - 시간 단위
 */
export function formatRelativeTime(
  locale: Locale,
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
): string {
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, unit);
}

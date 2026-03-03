import type { Locale } from '@workspace/shared/i18n';

const TITLE_MIN_LENGTH = 45;
const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MIN_LENGTH = 110;
const DESCRIPTION_MAX_LENGTH = 155;

interface AvailabilityMetaOutput {
  title: string;
  description: string;
  ogDescription: string;
}

interface AvailabilityDetailMetaInput {
  locale: Locale;
  propertyName: string | null | undefined;
  platformLabel: string | null | undefined;
  locationLabel: string | null | undefined;
}

interface AvailabilityRegionMetaInput {
  locale: Locale;
  regionName: string | null | undefined;
  platformLabel: string | null | undefined;
  propertyCount: number | null | undefined;
}

interface AvailabilityListMetaInput {
  locale: Locale;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function truncateText(value: string, maxLength: number): string {
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= maxLength) return normalized;

  const hardLimit = Math.max(maxLength - 3, 0);
  const sliced = normalized.slice(0, hardLimit + 1);
  const lastSpace = sliced.lastIndexOf(' ');

  if (lastSpace > Math.floor(hardLimit * 0.6)) {
    return `${sliced.slice(0, lastSpace).trimEnd()}...`;
  }
  return `${normalized.slice(0, hardLimit).trimEnd()}...`;
}

function ensureMinLength(value: string, minLength: number, extension: string): string {
  let normalized = normalizeWhitespace(value);
  if (normalized.length >= minLength) return normalized;

  const safeExtension = normalizeWhitespace(extension);
  if (safeExtension.length === 0) return normalized;

  while (normalized.length < minLength) {
    normalized = normalizeWhitespace(`${normalized} ${safeExtension}`);
  }

  return normalized;
}

function finalizeTitle(value: string, locale: Locale): string {
  const extended = ensureMinLength(value, TITLE_MIN_LENGTH, locale === 'ko' ? '실시간 데이터' : 'live insights');
  return truncateText(extended, TITLE_MAX_LENGTH);
}

function finalizeDescription(value: string, locale: Locale): string {
  const extended = ensureMinLength(
    value,
    DESCRIPTION_MIN_LENGTH,
    locale === 'ko'
      ? '플랫폼별 비교와 대체 숙소 탐색까지 한 번에 진행할 수 있습니다.'
      : 'Compare platforms and discover alternatives in one workflow.',
  );
  return truncateText(extended, DESCRIPTION_MAX_LENGTH);
}

function normalizeLocale(locale: Locale): 'ko' | 'en' {
  return locale === 'ko' ? 'ko' : 'en';
}

function valueOrFallback(value: string | null | undefined, fallback: string): string {
  const normalized = normalizeWhitespace(value ?? '');
  return normalized.length > 0 ? normalized : fallback;
}

function buildOutput(
  locale: Locale,
  title: string,
  description: string,
  ogDescription?: string,
): AvailabilityMetaOutput {
  return {
    title: finalizeTitle(title, locale),
    description: finalizeDescription(description, locale),
    ogDescription: finalizeDescription(ogDescription ?? description, locale),
  };
}

export function buildAvailabilityDetailMeta(input: AvailabilityDetailMetaInput): AvailabilityMetaOutput {
  const language = normalizeLocale(input.locale);

  if (language === 'ko') {
    const propertyName = valueOrFallback(input.propertyName, '숙소');
    const platformLabel = valueOrFallback(input.platformLabel, '플랫폼');
    const locationLabel = valueOrFallback(input.locationLabel, '해당 지역');

    return buildOutput(
      input.locale,
      `${propertyName} 예약 가능 여부·가격 추이 | ${platformLabel} 숙소 데이터`,
      `${locationLabel} ${propertyName}의 최신 예약 가능 여부, 평균 가격, 대체 숙소를 확인하고 빈방 알림으로 예약 타이밍을 빠르게 잡으세요.`,
      `${propertyName}의 예약 가능 여부와 가격 추이를 확인하고, 대체 숙소 비교와 빈방 알림 설정까지 한 번에 진행하세요.`,
    );
  }

  const propertyName = valueOrFallback(input.propertyName, 'property');
  const platformLabel = valueOrFallback(input.platformLabel, 'platform');
  const locationLabel = valueOrFallback(input.locationLabel, 'the area');

  return buildOutput(
    input.locale,
    `${propertyName} availability and price trends | ${platformLabel} data`,
    `Check ${propertyName} availability, average price, and alternatives in ${locationLabel}, then set Binbang alerts to book at the right moment.`,
    `Track ${propertyName} availability trends, compare alternatives, and set instant alerts for faster booking decisions on Binbang.`,
  );
}

export function buildAvailabilityRegionMeta(input: AvailabilityRegionMetaInput): AvailabilityMetaOutput {
  const language = normalizeLocale(input.locale);
  const hasCount = typeof input.propertyCount === 'number' && input.propertyCount > 0;

  if (language === 'ko') {
    const regionName = valueOrFallback(input.regionName, '지역');
    const platformLabel = valueOrFallback(input.platformLabel, '플랫폼');
    const propertyCountText = hasCount ? `${input.propertyCount}개` : '다수';

    return buildOutput(
      input.locale,
      `${regionName} ${platformLabel} 숙소 예약 가능 여부 | 지역 가격 추이`,
      `${regionName} 지역 ${platformLabel} 숙소 ${propertyCountText}의 예약 가능 여부와 평균 가격 범위를 비교하고, 상세 페이지에서 오픈율 추이를 확인하세요.`,
      `${regionName} 지역의 ${platformLabel} 숙소 예약 가능 여부와 가격 추이를 확인하고, 상세 페이지로 이동해 빈방 알림을 설정하세요.`,
    );
  }

  const regionName = valueOrFallback(input.regionName, 'region');
  const platformLabel = valueOrFallback(input.platformLabel, 'platform');
  const propertyCountText = hasCount ? String(input.propertyCount) : 'multiple';

  return buildOutput(
    input.locale,
    `${regionName} ${platformLabel} availability | Regional price trends`,
    `Compare availability and average prices across ${propertyCountText} ${platformLabel} properties in ${regionName}, then open detail pages for booking-rate trends.`,
    `Explore ${platformLabel} availability and regional price trends in ${regionName}, then drill into property detail pages for deeper insights.`,
  );
}

export function buildAvailabilityListMeta(input: AvailabilityListMetaInput): AvailabilityMetaOutput {
  const language = normalizeLocale(input.locale);

  if (language === 'ko') {
    return buildOutput(
      input.locale,
      '숙소 예약 가능 여부 목록 | 플랫폼별 가격·오픈율 비교',
      '빈방의 공개 숙소 목록에서 플랫폼별 예약 가능 여부, 평균 가격, 오픈율 추이를 한눈에 비교하고 상세 페이지로 빠르게 이동하세요.',
      '플랫폼별 예약 가능 여부와 가격 데이터를 비교하고, 지역/상세 페이지로 이동해 빈방 알림 설정까지 이어가세요.',
    );
  }

  return buildOutput(
    input.locale,
    'Accommodation availability list | Open rates and prices',
    "Browse Binbang's public accommodation availability list to compare platform open rates, average prices, and detail pages for booking trend analysis.",
    'Compare platform availability and pricing at a glance, then open regional and property pages for deeper booking trend insights.',
  );
}

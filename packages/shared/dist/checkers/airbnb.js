import { getPlatformSelectors } from '../selectors';
import { baseCheck } from './baseChecker';
import { formatDate } from './utils';
/**
 * Airbnb data-testid 및 JSON-LD 기반 추출기
 *
 * 추출 항목:
 * 1. 가용성: "예약하기" 버튼 존재 여부
 * 2. 가격: data-testid="book-it-default" 또는 aria-label
 * 3. 메타데이터: JSON-LD (VacationRental)
 */
const AIRBNB_DATA_EXTRACTOR = `function() {
  // ============================================
  // 1. JSON-LD 메타데이터 추출
  // ============================================
  let metadata = {};
  try {
    // URL에서 room ID 추출 (/rooms/877951015453398830)
    const urlMatch = window.location.pathname.match(/\\/rooms\\/([0-9]+)/);
    const platformId = urlMatch ? urlMatch[1] : null;

    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonLdScripts) {
      const jsonLd = JSON.parse(script.textContent || '{}');
      if (jsonLd['@type'] === 'VacationRental' || jsonLd['@type'] === 'Product') {
        metadata = {
          platformId: platformId,
          platformName: jsonLd.name,
          platformImage: Array.isArray(jsonLd.image) ? jsonLd.image[0] : jsonLd.image,
          platformDescription: jsonLd.description?.slice(0, 2000),
          latitude: jsonLd.latitude,
          longitude: jsonLd.longitude,
          ratingValue: jsonLd.aggregateRating?.ratingValue,
          reviewCount: parseInt(jsonLd.aggregateRating?.ratingCount) || undefined,
          rawJsonLd: jsonLd
        };
        break;
      }
    }
  } catch (e) {
    // JSON-LD 파싱 실패 무시
  }

  // ============================================
  // 2. 가격 추출
  // ============================================
  let price = null;

  // 우선순위 1: aria-label에서 총액 추출
  const ariaPrice = document.querySelector('[aria-label*="총액"]');
  if (ariaPrice) {
    const label = ariaPrice.getAttribute('aria-label') || '';
    const match = label.match(/총액[^₩$€£]*([₩$€£][\\s]*[\\d,]+)/);
    if (match) {
      price = match[1].replace(/\\s/g, '').replace(/,$/g, '');
    }
  }

  // 우선순위 2: data-testid="book-it-default"에서 추출
  if (!price) {
    const bookIt = document.querySelector('[data-testid="book-it-default"]');
    if (bookIt) {
      const text = bookIt.innerText || '';
      const match = text.match(/[₩$€£][\\s]*[\\d,]+/);
      if (match) {
        price = match[0].replace(/\\s/g, '').replace(/,$/g, '');
      }
    }
  }

  // ============================================
  // 3. 가용성 확인
  // ============================================
  const bodyText = document.body.innerText || '';
  const hasReserveButton = bodyText.includes('예약하기') || bodyText.includes('Reserve');
  const isUnavailable = bodyText.includes('날짜 변경') || bodyText.includes('Change dates') ||
                        bodyText.includes('이용이 불가능') || bodyText.includes('not available');

  // ============================================
  // 4. 결과 반환
  // ============================================

  // Case 1: 예약 불가
  if (isUnavailable && !hasReserveButton) {
    return {
      matched: true,
      available: false,
      price: null,
      reason: 'unavailable pattern detected',
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };
  }

  // Case 2: 예약 가능 + 가격 있음
  if (hasReserveButton && price) {
    return {
      matched: true,
      available: true,
      price: price,
      reason: null,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };
  }

  // Case 3: 예약 버튼만 있음
  if (hasReserveButton) {
    return {
      matched: true,
      available: true,
      price: '가격 확인 필요',
      reason: null,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };
  }

  // Case 4: 판단 불가 → 기존 패턴으로 fallback
  return {
    matched: false,
    available: false,
    price: null,
    reason: null,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined
  };
}`;
export async function checkAirbnb(accommodation, options) {
    // DB에서 동적 셀렉터/패턴 로드 (캐시된 값 사용, 실패 시 fallback)
    const selectorCache = getPlatformSelectors('AIRBNB');
    return baseCheck(accommodation, {
        patterns: selectorCache.patterns,
        scrollDistance: 800,
        // DB에서 빌드된 extractor가 있으면 사용, 없으면 하드코딩된 fallback
        customExtractor: selectorCache.extractorCode || AIRBNB_DATA_EXTRACTOR,
        testableAttributes: options?.testableAttributes,
        buildUrl: ({ url, checkIn, checkOut, adults }) => {
            // URL에서 기존 쿼리 파라미터 제거
            const baseUrl = url.split('?')[0];
            return `${baseUrl}?check_in=${formatDate(checkIn)}&check_out=${formatDate(checkOut)}&adults=${adults}`;
        },
    });
}

import type { AccommodationToCheck, CheckResult } from '@/types/checker';
import { buildAccommodationUrl } from '@/url-builder';

import type { CheckerRuntimeConfig } from './baseChecker';
import { baseCheck } from './baseChecker';
import { getPlatformSelectors } from './selectors';

/**
 * Agoda data-* 속성 기반 추출기
 * UI 텍스트 변경에 독립적으로 가용성/가격/메타데이터를 추출
 *
 * 추출 항목:
 * 1. 가용성: data-element-value="available/unavailable"
 * 2. 가격: data-testid="price-after-tax" (세금 포함 1박 가격)
 * 3. 메타데이터: JSON-LD (schema.org Hotel)
 */
/* eslint-disable no-useless-escape */
const AGODA_DATA_EXTRACTOR = `function() {
  // ============================================
  // 1. JSON-LD 메타데이터 추출
  // ============================================
  let metadata = {};
  try {
    // hotelId 또는 propertyId 추출 (페이지 스크립트에서)
    let platformId = null;
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const text = script.textContent || '';
      const hotelIdMatch = text.match(/hotelId[:s]*([0-9]+)/);
      if (hotelIdMatch) {
        platformId = hotelIdMatch[1];
        break;
      }
      const propertyIdMatch = text.match(/propertyId[:s]*([0-9]+)/);
      if (propertyIdMatch) {
        platformId = propertyIdMatch[1];
        break;
      }
    }

    const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
    if (jsonLdScript) {
      const jsonLd = JSON.parse(jsonLdScript.textContent || '{}');
      if (jsonLd['@type'] === 'Hotel') {
        metadata = {
          platformId: platformId,
          platformName: jsonLd.name,
          platformImage: jsonLd.image,
          platformDescription: jsonLd.description?.slice(0, 2000), // 너무 길면 자르기
          addressCountry: jsonLd.address?.addressCountry,
          addressRegion: jsonLd.address?.addressRegion,
          addressLocality: jsonLd.address?.addressLocality,
          postalCode: jsonLd.address?.postalCode,
          streetAddress: jsonLd.address?.streetAddress,
          ratingValue: jsonLd.aggregateRating?.ratingValue,
          reviewCount: jsonLd.aggregateRating?.reviewCount,
          rawJsonLd: jsonLd
        };

        // hasMap에서 위도/경도 추출 시도
        if (jsonLd.hasMap) {
          const coordMatch = jsonLd.hasMap.match(/center=([\\d.-]+)%2c([\\d.-]+)/);
          if (coordMatch) {
            metadata.latitude = parseFloat(coordMatch[1]);
            metadata.longitude = parseFloat(coordMatch[2]);
          }
        }
      }
    }
  } catch (e) {
    // JSON-LD 파싱 실패 무시
  }

  // ============================================
  // 2. 가용성 확인
  // ============================================
  const unavailableEl = document.querySelector('[data-element-value="unavailable"]');
  const availableEl = document.querySelector('[data-element-value="available"]');
  const roomGrid = document.querySelector('[data-element-name="property-room-grid-root-navbar-menu"]');
  const priceSection = document.querySelector('[data-testid="room-offer-price-info"]');

  // ============================================
  // 3. 가격 추출 (세금 포함 1박 가격 우선)
  // ============================================
  let price = null;

  // 우선순위 1: data-testid="price-after-tax" (세금 포함)
  const priceAfterTax = document.querySelector('[data-testid="price-after-tax"]');
  if (priceAfterTax) {
    const text = priceAfterTax.innerText || '';
    const match = text.match(/[₩$€£][\\s]*[\\d,]+/);
    if (match) {
      price = match[0].replace(/\\s/g, '');
    }
  }

  // 우선순위 2: data-element-name="fpc-room-price" (세금 전 가격)
  if (!price) {
    const fpcPrice = document.querySelector('[data-element-name="fpc-room-price"]');
    if (fpcPrice) {
      const text = fpcPrice.innerText || '';
      const match = text.match(/[₩$€£][\\s]*[\\d,]+/);
      if (match) {
        price = match[0].replace(/\\s/g, '');
      }
    }
  }

  // ============================================
  // 4. 결과 반환
  // ============================================

  // Case 1: 가격이 있으면 예약 가능 (가장 확실한 지표)
  if (price) {
    return {
      matched: true,
      available: true,
      price: price,
      reason: null,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };
  }

  // Case 2: unavailable 표시가 있으면 예약 불가 (판매 완료 등)
  if (unavailableEl) {
    return {
      matched: true,
      available: false,
      price: null,
      reason: 'data-element-value: unavailable',
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };
  }

  // Case 3: available 표시가 있고 가격 섹션도 있으면 예약 가능
  if (availableEl && (roomGrid || priceSection)) {
    return {
      matched: true,
      available: true,
      price: '가격 확인 필요',
      reason: null,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined
    };
  }

  // Case 4: 판단 불가 → 기존 텍스트 패턴으로 fallback (메타데이터는 전달)
  return {
    matched: false,
    available: false,
    price: null,
    reason: null,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined
  };
}`;

export interface CheckAgodaOptions {
  testableAttributes?: string[];
  runtimeConfig?: CheckerRuntimeConfig;
}

export async function checkAgoda(
  accommodation: AccommodationToCheck,
  options?: CheckAgodaOptions,
): Promise<CheckResult> {
  // DB에서 동적 셀렉터/패턴 로드 (캐시된 값 사용, 실패 시 fallback)
  const selectorCache = getPlatformSelectors('AGODA');

  if (!options?.runtimeConfig) {
    throw new Error('runtimeConfig is required for checkAgoda');
  }

  return baseCheck(
    accommodation,
    {
      patterns: selectorCache.patterns,
      scrollDistance: 2000,
      // DB에서 빌드된 extractor가 있으면 사용, 없으면 하드코딩된 fallback
      customExtractor: selectorCache.extractorCode || AGODA_DATA_EXTRACTOR,
      testableAttributes: options?.testableAttributes,
      buildUrl: buildAccommodationUrl,
    },
    options.runtimeConfig,
  );
}

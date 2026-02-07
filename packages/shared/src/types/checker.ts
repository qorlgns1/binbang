import type { Platform } from '@workspace/db';

// JSON-LD 기반 숙소 메타데이터
export interface AccommodationMetadata {
  // 플랫폼 고유 ID
  platformId?: string;

  // 기본 정보
  platformName?: string;
  platformImage?: string;
  platformDescription?: string;

  // 주소
  addressCountry?: string;
  addressRegion?: string;
  addressLocality?: string;
  postalCode?: string;
  streetAddress?: string;

  // 평점
  ratingValue?: number;
  reviewCount?: number;

  // 위치
  latitude?: number;
  longitude?: number;

  // 전체 JSON-LD (백업)
  rawJsonLd?: Record<string, unknown>;
}

export interface MatchedSelector {
  category: string;
  name: string;
  matched: boolean;
}

export interface MatchedPattern {
  type: string;
  pattern: string;
  matched: boolean;
}

export interface TestableElement {
  attribute: string; // 속성명 (data-testid, data-selenium 등)
  value: string; // 속성값
  tagName: string;
  text: string; // 텍스트 내용
  html: string; // outerHTML 전체
}

export interface CheckResult {
  available: boolean;
  price: string | null;
  checkUrl: string;
  error: string | null;
  retryCount: number;
  metadata?: AccommodationMetadata; // JSON-LD에서 추출한 메타데이터
  matchedSelectors?: MatchedSelector[]; // 테스트용: 매칭된 셀렉터 목록
  matchedPatterns?: MatchedPattern[]; // 테스트용: 매칭된 패턴 목록
  testableElements?: TestableElement[]; // 테스트용: data-testid 등 추출된 요소들
}

export interface AccommodationToCheck {
  id: string;
  url: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  rooms?: number; // 객실 수
  platform: Platform;
}

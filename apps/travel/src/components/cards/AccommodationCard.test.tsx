/**
 * P3-UI-001: 숙소 카드 상태 매트릭스 (Active CTA / Pending CTA)
 * P3-UI-003: 제휴 고지/투명성
 * 요구사항-테스트 매핑: TC-P3A-01, TC-P3A-02, TC-P3A-03, TC-P3A-04
 */
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AccommodationCard } from './AccommodationCard';
import type { AccommodationEntity } from '@/lib/types';

vi.mock('next/image', () => ({
  default: function MockImage({ alt }: { alt: string }) {
    return <span data-testid='mock-image'>{alt}</span>;
  },
}));
vi.mock('@/lib/affiliateTracking', () => ({
  trackImpressionOnce: vi.fn(),
  trackAffiliateEvent: vi.fn(),
}));
vi.mock('@/lib/featureFlags', () => ({
  isAffiliateCtaEnabled: vi.fn(() => true),
}));

const baseAccommodation: AccommodationEntity = {
  placeId: 'place_1',
  name: '테스트 호텔',
  address: '서울시 강남구',
  latitude: 37.5,
  longitude: 127.0,
  types: ['lodging'],
  isAffiliate: true,
};

describe('AccommodationCard', () => {
  it('renders Active CTA with "예약하기" when ctaEnabled and affiliateLink exist', () => {
    const accommodation: AccommodationEntity = {
      ...baseAccommodation,
      affiliateLink: 'https://example.com/book',
    };
    const html = renderToStaticMarkup(
      <AccommodationCard
        accommodation={accommodation}
        ctaEnabled={true}
        trackingContext={{
          conversationId: 'conv_1',
          provider: 'awin:123',
        }}
      />,
    );
    expect(html).toContain('예약하기');
    expect(html).toContain('예약/구매 시 제휴 수수료를 받을 수 있습니다');
    expect(html).toContain('광고/제휴');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer sponsored"');
  });

  it('renders Pending CTA with "제휴 링크 준비중" when ctaEnabled is false', () => {
    const accommodation: AccommodationEntity = {
      ...baseAccommodation,
      affiliateLink: undefined,
    };
    const html = renderToStaticMarkup(
      <AccommodationCard
        accommodation={accommodation}
        ctaEnabled={false}
        trackingContext={{ provider: 'awin_pending:accommodation' }}
      />,
    );
    expect(html).toContain('제휴 링크 준비중');
    expect(html).toContain('예약/구매 시 제휴 수수료를 받을 수 있습니다');
    expect(html).toContain('광고/제휴');
    expect(html).toContain('aria-disabled');
  });

  it('shows "이미지 없음" when photoUrl is missing', () => {
    const accommodation: AccommodationEntity = {
      ...baseAccommodation,
      photoUrl: undefined,
    };
    const html = renderToStaticMarkup(<AccommodationCard accommodation={accommodation} ctaEnabled={false} />);
    expect(html).toContain('이미지 없음');
  });

  it('shows Stage A price placeholder when no price (가격은 제휴 연동 후 제공됩니다)', () => {
    const accommodation: AccommodationEntity = {
      ...baseAccommodation,
      priceAmount: undefined,
      priceCurrency: undefined,
    };
    const html = renderToStaticMarkup(<AccommodationCard accommodation={accommodation} ctaEnabled={false} />);
    expect(html).toContain('가격은 제휴 연동 후 제공됩니다');
  });
});

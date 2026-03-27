import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRequireAdmin, mockAgodaHotelSearch } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockAgodaHotelSearch: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock('@/services/admin/agoda.service', () => ({
  AgodaConfigError: class AgodaConfigError extends Error {},
  agodaHotelSearch: mockAgodaHotelSearch,
}));

import { POST } from './route';

describe('POST /api/admin/agoda/hotel-search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ user: { id: 'admin_001' } });
  });

  it('raw Agoda 응답에 poll 기준 요약 필드를 추가한다', async () => {
    mockAgodaHotelSearch.mockResolvedValue({
      ok: true,
      status: 200,
      message: 'Hotel List Search 성공',
      body: {
        results: [
          {
            hotelId: 63565,
            hotelName: '시타딘 레 알 파리',
            roomtypeName: '스튜디오룸',
            currency: 'USD',
            dailyRate: 240.56,
            landingURL: 'https://www.agoda.com/ko-kr/test-flat',
          },
        ],
      },
    });

    const response = await POST(
      new Request('http://localhost/api/admin/agoda/hotel-search', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );
    const json = (await response.json()) as {
      availability: string | null;
      normalizedOfferCount: number | null;
      landingUrlSample: string | null;
      body: { results: unknown[] };
    };

    expect(json.availability).toBe('AVAILABLE');
    expect(json.normalizedOfferCount).toBe(1);
    expect(json.landingUrlSample).toBe('https://www.agoda.com/ko-kr/test-flat');
    expect(json.body.results).toHaveLength(1);
  });
});

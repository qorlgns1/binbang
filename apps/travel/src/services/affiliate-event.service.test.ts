/**
 * P3-UI-005: 이벤트 트래킹 UI 계약 / AffiliateEvent 저장
 * 요구사항-테스트 매핑: TC-P3A-06, TC-P3A-07, TC-P3A-08
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAffiliateEvent } from './affiliate-event.service';

const { mockPrismaCreate, mockUserFindUnique } = vi.hoisted(() => ({
  mockPrismaCreate: vi.fn(),
  mockUserFindUnique: vi.fn(),
}));

vi.mock('@workspace/db', () => ({
  prisma: {
    affiliateEvent: { create: mockPrismaCreate },
    user: { findUnique: mockUserFindUnique },
  },
}));

describe('affiliate-event.service', () => {
  beforeEach(() => {
    mockPrismaCreate.mockReset();
    mockUserFindUnique.mockReset();
    mockUserFindUnique.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates impression event and returns created: true', async () => {
    mockPrismaCreate.mockResolvedValue({ id: 'evt_1' });

    const result = await createAffiliateEvent({
      conversationId: 'conv_1',
      provider: 'awin_pending:accommodation',
      eventType: 'impression',
      productId: 'place_1',
      productName: 'Hotel',
      category: 'accommodation',
      isCtaEnabled: false,
    });

    expect(result.created).toBe(true);
    expect(result.id).toBe('evt_1');
    expect(mockPrismaCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          conversationId: 'conv_1',
          provider: 'awin_pending:accommodation',
          eventType: 'impression',
          productId: 'place_1',
          productName: 'Hotel',
          category: 'accommodation',
          isCtaEnabled: false,
        }),
      }),
    );
  });

  it('creates cta_attempt with reasonCode no_advertiser_for_category', async () => {
    mockPrismaCreate.mockResolvedValue({ id: 'evt_2' });

    await createAffiliateEvent({
      provider: 'awin_pending:accommodation',
      eventType: 'cta_attempt',
      reasonCode: 'no_advertiser_for_category',
      productId: 'place_2',
      productName: 'Inn',
      category: 'accommodation',
      isCtaEnabled: false,
    });

    expect(mockPrismaCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'cta_attempt',
          reasonCode: 'no_advertiser_for_category',
          isCtaEnabled: false,
        }),
      }),
    );
  });

  it('uses idempotencyKey for impression (conversationId + productId + local day)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-19T12:00:00.000Z'));
    mockPrismaCreate.mockResolvedValue({ id: 'evt_3' });

    await createAffiliateEvent({
      conversationId: 'conv_1',
      provider: 'awin:1',
      eventType: 'impression',
      productId: 'place_1',
      productName: 'H',
      category: 'accommodation',
      isCtaEnabled: true,
    });

    expect(mockPrismaCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          idempotencyKey: expect.stringMatching(/^impression:conv_1:place_1:\d{4}-\d{2}-\d{2}$/),
        }),
      }),
    );
  });

  it('returns deduped: true on unique constraint for impression', async () => {
    const uniqueError = new Error('Unique constraint');
    (uniqueError as Error & { code?: string }).code = 'P2002';
    mockPrismaCreate.mockRejectedValueOnce(uniqueError);

    const result = await createAffiliateEvent({
      conversationId: 'conv_1',
      provider: 'awin:1',
      eventType: 'impression',
      productId: 'place_1',
      productName: 'H',
      category: 'accommodation',
      isCtaEnabled: true,
    });

    expect(result.created).toBe(false);
    expect(result.deduped).toBe(true);
  });
});

import { renderToStaticMarkup } from 'react-dom/server';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PricingPanel } from './PricingPanel';

const { mockUseCasePricePreviewQuery, mockUseCasePriceQuoteHistoryQuery, mockUseSaveCasePriceQuoteMutation } =
  vi.hoisted(
    (): {
      mockUseCasePricePreviewQuery: ReturnType<typeof vi.fn>;
      mockUseCasePriceQuoteHistoryQuery: ReturnType<typeof vi.fn>;
      mockUseSaveCasePriceQuoteMutation: ReturnType<typeof vi.fn>;
    } => ({
      mockUseCasePricePreviewQuery: vi.fn(),
      mockUseCasePriceQuoteHistoryQuery: vi.fn(),
      mockUseSaveCasePriceQuoteMutation: vi.fn(),
    }),
  );

vi.mock('@/features/admin/cases', () => ({
  useCasePricePreviewQuery: mockUseCasePricePreviewQuery,
  useCasePriceQuoteHistoryQuery: mockUseCasePriceQuoteHistoryQuery,
  useSaveCasePriceQuoteMutation: mockUseSaveCasePriceQuoteMutation,
}));

describe('PricingPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseCasePricePreviewQuery.mockReturnValue({
      data: null,
      isFetching: false,
      isError: false,
      error: null,
    });

    mockUseCasePriceQuoteHistoryQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    mockUseSaveCasePriceQuoteMutation.mockReturnValue({
      isPending: false,
      isError: false,
      error: null,
      mutate: vi.fn(),
    });
  });

  it('renders title and policy badge', () => {
    const html = renderToStaticMarkup(<PricingPanel caseId='case-1' />);

    expect(html).toContain('견적 산식');
    expect(html).toContain('policy v1');
  });

  it('renders preview rounded amount and weight breakdown', () => {
    mockUseCasePricePreviewQuery.mockReturnValue({
      data: {
        caseId: 'case-1',
        pricingPolicyVersion: 'v1',
        inputsSnapshot: {
          platform: 'AGODA',
          durationBucket: 'BETWEEN_24H_72H',
          difficulty: 'M',
          urgencyBucket: 'D2_D3',
          frequencyBucket: 'F15M',
        },
        weightsSnapshot: {
          baseFee: 17000,
          duration: 5000,
          difficulty: 7000,
          urgency: 7000,
          frequency: 5000,
        },
        computedAmountKrw: 41000,
        roundedAmountKrw: 41000,
      },
      isFetching: false,
      isError: false,
      error: null,
    });

    const html = renderToStaticMarkup(<PricingPanel caseId='case-1' />);

    expect(html).toContain('41,000원');
    expect(html).toContain('기본요금');
    expect(html).toContain('반올림 전 합계');
  });

  it('renders quote history rows with active state', () => {
    mockUseCasePriceQuoteHistoryQuery.mockReturnValue({
      data: [
        {
          quoteId: 'pq-1',
          caseId: 'case-1',
          pricingPolicyVersion: 'v1',
          inputsSnapshot: {
            platform: 'AGODA',
            durationBucket: 'BETWEEN_24H_72H',
            difficulty: 'M',
            urgencyBucket: 'D2_D3',
            frequencyBucket: 'F15M',
          },
          weightsSnapshot: {
            baseFee: 17000,
            duration: 5000,
            difficulty: 7000,
            urgency: 7000,
            frequency: 5000,
          },
          computedAmountKrw: 41000,
          roundedAmountKrw: 41000,
          changeReason: 'initial quote',
          isActive: true,
          changedBy: 'admin-1',
          createdAt: '2026-02-15T02:00:00.000Z',
          updatedAt: '2026-02-15T02:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
    });

    const html = renderToStaticMarkup(<PricingPanel caseId='case-1' />);

    expect(html).toContain('견적 변경 이력');
    expect(html).toContain('initial quote');
    expect(html).toContain('활성');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listAwinTransactions } from '../awin.service';

const { mockGetAwinToken, mockFetchPublisherId, mockUpsertFromProgrammes } = vi.hoisted(() => ({
  mockGetAwinToken: vi.fn(),
  mockFetchPublisherId: vi.fn(),
  mockUpsertFromProgrammes: vi.fn(),
}));

vi.mock('@/lib/awin', () => ({
  AWIN_API_BASE: 'https://api.awin.test',
  getAwinToken: mockGetAwinToken,
  fetchPublisherId: mockFetchPublisherId,
}));

vi.mock('../affiliate-advertiser.service', () => ({
  upsertFromProgrammes: mockUpsertFromProgrammes,
}));

function getUrlSearchParams(callIndex: number): URLSearchParams {
  const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[callIndex]?.[0] as string;
  const parsed = new URL(url);
  return parsed.searchParams;
}

describe('admin/awin.service listAwinTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAwinToken.mockReturnValue('test-token');
    mockFetchPublisherId.mockResolvedValue(12345);
    global.fetch = vi.fn();
  });

  it('uses single request when date range is 31 days or less', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify([{ id: 'tx-1' }]), { status: 200 }),
    );

    const result = await listAwinTransactions({
      startDate: '2026-02-01',
      endDate: '2026-02-15',
      status: 'approved',
      dateType: 'transaction',
      timezone: 'UTC',
    });

    expect(result.ok).toBe(true);
    expect(result.message).toBe('Transactions retrieved.');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(getUrlSearchParams(0).get('startDate')).toBe('2026-02-01T00:00:00');
    expect(getUrlSearchParams(0).get('endDate')).toBe('2026-02-15T23:59:59');
  });

  it('splits ranges over 31 days and merges chunked results', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 'tx-1' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ transactions: [{ id: 'tx-2' }] }), { status: 200 }));

    const result = await listAwinTransactions({
      startDate: '2026-01-01',
      endDate: '2026-02-20',
      status: 'approved',
      dateType: 'transaction',
      timezone: 'UTC',
    });

    expect(result.ok).toBe(true);
    expect(result.message).toContain('2 chunks');
    expect(global.fetch).toHaveBeenCalledTimes(2);

    expect(getUrlSearchParams(0).get('startDate')).toBe('2026-01-01T00:00:00');
    expect(getUrlSearchParams(0).get('endDate')).toBe('2026-01-31T23:59:59');
    expect(getUrlSearchParams(1).get('startDate')).toBe('2026-02-01T00:00:00');
    expect(getUrlSearchParams(1).get('endDate')).toBe('2026-02-20T23:59:59');

    const body = result.body as { transactions: Array<{ id: string }>; chunkCount: number };
    expect(body.chunkCount).toBe(2);
    expect(body.transactions).toHaveLength(2);
  });

  it('returns validation-like error when startDate is after endDate', async () => {
    const result = await listAwinTransactions({
      startDate: '2026-02-20',
      endDate: '2026-02-01',
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns chunk failure details when one chunk fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 'tx-1' }]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'rate limit' }), { status: 429 }));

    const result = await listAwinTransactions({
      startDate: '2026-01-01',
      endDate: '2026-02-20',
    });

    expect(result.ok).toBe(false);
    expect(result.message).toContain('chunk failed');
    expect(result.detail).toContain('chunk 2/2');
  });
});

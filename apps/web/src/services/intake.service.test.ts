import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createFormSubmission,
  getFormSubmissionById,
  getFormSubmissions,
} from './intake.service';

const { mockCreate, mockFindUnique, mockFindMany, mockCount } = vi.hoisted(
  (): {
    mockCreate: ReturnType<typeof vi.fn>;
    mockFindUnique: ReturnType<typeof vi.fn>;
    mockFindMany: ReturnType<typeof vi.fn>;
    mockCount: ReturnType<typeof vi.fn>;
  } => ({
    mockCreate: vi.fn(),
    mockFindUnique: vi.fn(),
    mockFindMany: vi.fn(),
    mockCount: vi.fn(),
  }),
);

vi.mock('@workspace/db', () => ({
  prisma: {
    formSubmission: {
      create: mockCreate,
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      count: mockCount,
    },
  },
}));

const NOW = new Date('2026-02-11T10:00:00.000Z');

function makeRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'sub-1',
    responseId: 'resp-abc',
    status: 'RECEIVED',
    rawPayload: { contact_channel: '카카오톡', condition_definition: '테스트 조건' },
    formVersion: null,
    sourceIp: '1.2.3.4',
    extractedFields: null,
    rejectionReason: null,
    receivedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('intake.service', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // createFormSubmission
  // ==========================================================================

  describe('createFormSubmission', (): void => {
    it('creates a new submission and returns created: true', async (): Promise<void> => {
      const row = makeRow();
      mockCreate.mockResolvedValue(row);

      const result = await createFormSubmission({
        responseId: 'resp-abc',
        rawPayload: { contact_channel: '카카오톡' },
        sourceIp: '1.2.3.4',
      });

      expect(result.created).toBe(true);
      expect(result.submission.responseId).toBe('resp-abc');
      expect(result.submission.receivedAt).toBe(NOW.toISOString());
      expect(mockCreate).toHaveBeenCalledOnce();
    });

    it('returns existing submission on duplicate responseId (P2002)', async (): Promise<void> => {
      const p2002Error = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
      mockCreate.mockRejectedValue(p2002Error);

      const existing = makeRow();
      mockFindUnique.mockResolvedValue(existing);

      const result = await createFormSubmission({
        responseId: 'resp-abc',
        rawPayload: { contact_channel: '카카오톡' },
      });

      expect(result.created).toBe(false);
      expect(result.submission.responseId).toBe('resp-abc');
      expect(mockCreate).toHaveBeenCalledOnce();
      expect(mockFindUnique).toHaveBeenCalledOnce();
    });

    it('throws on non-P2002 errors', async (): Promise<void> => {
      const dbError = new Error('Connection lost');
      mockCreate.mockRejectedValue(dbError);

      await expect(
        createFormSubmission({
          responseId: 'resp-abc',
          rawPayload: { contact_channel: '카카오톡' },
        }),
      ).rejects.toThrow('Connection lost');
    });

    it('throws when P2002 but findUnique returns null (defensive)', async (): Promise<void> => {
      const p2002Error = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
      mockCreate.mockRejectedValue(p2002Error);
      mockFindUnique.mockResolvedValue(null);

      await expect(
        createFormSubmission({
          responseId: 'resp-abc',
          rawPayload: { contact_channel: '카카오톡' },
        }),
      ).rejects.toThrow('Unique constraint');
    });
  });

  // ==========================================================================
  // getFormSubmissionById
  // ==========================================================================

  describe('getFormSubmissionById', (): void => {
    it('returns null when not found', async (): Promise<void> => {
      mockFindUnique.mockResolvedValue(null);

      const result = await getFormSubmissionById('non-existent');
      expect(result).toBeNull();
    });

    it('returns submission when found', async (): Promise<void> => {
      mockFindUnique.mockResolvedValue(makeRow());

      const result = await getFormSubmissionById('sub-1');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('sub-1');
      expect(result?.rawPayload).toEqual({
        contact_channel: '카카오톡',
        condition_definition: '테스트 조건',
      });
    });
  });

  // ==========================================================================
  // getFormSubmissions
  // ==========================================================================

  describe('getFormSubmissions', (): void => {
    it('returns paginated submissions with total on first page', async (): Promise<void> => {
      const rows = [makeRow({ id: 'sub-1' }), makeRow({ id: 'sub-2' })];
      mockFindMany.mockResolvedValue(rows);
      mockCount.mockResolvedValue(2);

      const result = await getFormSubmissions({ limit: 20 });

      expect(result.submissions).toHaveLength(2);
      expect(result.nextCursor).toBeNull();
      expect(result.total).toBe(2);
    });

    it('returns nextCursor when hasMore', async (): Promise<void> => {
      const rows = [
        makeRow({ id: 'sub-1' }),
        makeRow({ id: 'sub-2' }),
        makeRow({ id: 'sub-3' }),
      ];
      mockFindMany.mockResolvedValue(rows);
      mockCount.mockResolvedValue(5);

      const result = await getFormSubmissions({ limit: 2 });

      expect(result.submissions).toHaveLength(2);
      expect(result.nextCursor).toBe('sub-2');
    });

    it('does not include total on cursor page', async (): Promise<void> => {
      mockFindMany.mockResolvedValue([makeRow()]);

      const result = await getFormSubmissions({ limit: 20, cursor: 'sub-0' });

      expect(result.total).toBeUndefined();
      expect(mockCount).not.toHaveBeenCalled();
    });

    it('filters by status', async (): Promise<void> => {
      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);

      await getFormSubmissions({ limit: 20, status: 'REJECTED' as never });

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'REJECTED' },
        }),
      );
    });
  });
});

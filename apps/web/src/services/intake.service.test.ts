import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFormSubmission, getFormSubmissionById, getFormSubmissions } from './intake.service';

const { mockCreate, mockFindUnique, mockFindMany, mockCount, mockUpdate } = vi.hoisted(
  (): {
    mockCreate: ReturnType<typeof vi.fn>;
    mockFindUnique: ReturnType<typeof vi.fn>;
    mockFindMany: ReturnType<typeof vi.fn>;
    mockCount: ReturnType<typeof vi.fn>;
    mockUpdate: ReturnType<typeof vi.fn>;
  } => ({
    mockCreate: vi.fn(),
    mockFindUnique: vi.fn(),
    mockFindMany: vi.fn(),
    mockCount: vi.fn(),
    mockUpdate: vi.fn(),
  }),
);

vi.mock('@workspace/db', () => ({
  prisma: {
    formSubmission: {
      create: mockCreate,
      findUnique: mockFindUnique,
      findMany: mockFindMany,
      count: mockCount,
      update: mockUpdate,
    },
  },
}));

const NOW = new Date('2026-02-11T10:00:00.000Z');
const FUTURE_DATE = '2026-12-31';

function makeValidPayload(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    contact_channel: '카카오톡',
    contact_value: 'user123',
    target_url: 'https://www.airbnb.com/rooms/12345',
    condition_definition: '2인 기준 1박 30만원 이하로 예약 가능한 상태',
    request_window: FUTURE_DATE,
    check_frequency: '30분마다',
    billing_consent: true,
    scope_consent: true,
    ...overrides,
  };
}

function makeRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'sub-1',
    responseId: 'resp-abc',
    status: 'RECEIVED',
    rawPayload: makeValidPayload(),
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
    mockUpdate.mockResolvedValue({ id: 'sub-1' });
  });

  // ==========================================================================
  // createFormSubmission
  // ==========================================================================

  describe('createFormSubmission', (): void => {
    it('creates a new submission with valid payload and extracts fields', async (): Promise<void> => {
      const payload = makeValidPayload();
      const row = makeRow({ rawPayload: payload });
      const updatedRow = makeRow({ rawPayload: payload, extractedFields: payload });

      mockCreate.mockResolvedValue(row);
      mockFindUnique.mockResolvedValue(updatedRow);

      const result = await createFormSubmission({
        responseId: 'resp-abc',
        rawPayload: payload,
        sourceIp: '1.2.3.4',
      });

      expect(result.created).toBe(true);
      expect(result.submission.status).toBe('RECEIVED');
      expect(result.submission.extractedFields).toEqual(payload);
      expect(mockCreate).toHaveBeenCalledOnce();
      expect(mockUpdate).toHaveBeenCalledOnce();
      expect(mockFindUnique).toHaveBeenCalledOnce();
    });

    it('rejects submission with invalid payload and sets rejectionReason', async (): Promise<void> => {
      const payload = { contact_channel: '카카오톡', billing_consent: false };
      const row = makeRow({ rawPayload: payload });
      const rejectedRow = makeRow({
        rawPayload: payload,
        status: 'REJECTED',
        rejectionReason: 'some reason',
      });

      mockCreate.mockResolvedValue(row);
      mockFindUnique.mockResolvedValue(rejectedRow);

      const result = await createFormSubmission({
        responseId: 'resp-abc',
        rawPayload: payload,
      });

      expect(result.created).toBe(true);
      expect(result.submission.status).toBe('REJECTED');
      expect(result.submission.rejectionReason).toBeTruthy();
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'REJECTED' }),
        }),
      );
    });

    it('returns existing submission on duplicate responseId (P2002)', async (): Promise<void> => {
      const p2002Error = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
      mockCreate.mockRejectedValue(p2002Error);

      const existing = makeRow();
      mockFindUnique.mockResolvedValue(existing);

      const result = await createFormSubmission({
        responseId: 'resp-abc',
        rawPayload: makeValidPayload(),
      });

      expect(result.created).toBe(false);
      expect(result.submission.responseId).toBe('resp-abc');
      expect(mockCreate).toHaveBeenCalledOnce();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('throws on non-P2002 errors', async (): Promise<void> => {
      const dbError = new Error('Connection lost');
      mockCreate.mockRejectedValue(dbError);

      await expect(
        createFormSubmission({
          responseId: 'resp-abc',
          rawPayload: makeValidPayload(),
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
          rawPayload: makeValidPayload(),
        }),
      ).rejects.toThrow('Unique constraint');
    });
  });

  // ==========================================================================
  // validation: individual field checks
  // ==========================================================================

  describe('rawPayload validation', (): void => {
    function setupCreateWithPayload(payload: Record<string, unknown>) {
      const row = makeRow({ rawPayload: payload });
      mockCreate.mockResolvedValue(row);
      // findUnique will be called after update to return the latest state
      mockFindUnique.mockImplementation(({ where }: { where: { id?: string; responseId?: string } }) => {
        if (where.id) return Promise.resolve(row);
        return Promise.resolve(null);
      });
    }

    it('rejects when billing_consent is false', async (): Promise<void> => {
      const payload = makeValidPayload({ billing_consent: false });
      setupCreateWithPayload(payload);

      await createFormSubmission({ responseId: 'resp-1', rawPayload: payload });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'REJECTED',
            rejectionReason: expect.stringContaining('비용 발생 동의'),
          }),
        }),
      );
    });

    it('rejects when scope_consent is false', async (): Promise<void> => {
      const payload = makeValidPayload({ scope_consent: false });
      setupCreateWithPayload(payload);

      await createFormSubmission({ responseId: 'resp-2', rawPayload: payload });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'REJECTED',
            rejectionReason: expect.stringContaining('서비스 범위 동의'),
          }),
        }),
      );
    });

    it('rejects when target_url is invalid', async (): Promise<void> => {
      const payload = makeValidPayload({ target_url: 'not-a-url' });
      setupCreateWithPayload(payload);

      await createFormSubmission({ responseId: 'resp-3', rawPayload: payload });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'REJECTED',
            rejectionReason: expect.stringContaining('URL'),
          }),
        }),
      );
    });

    it('rejects when condition_definition is too short', async (): Promise<void> => {
      const payload = makeValidPayload({ condition_definition: '짧음' });
      setupCreateWithPayload(payload);

      await createFormSubmission({ responseId: 'resp-4', rawPayload: payload });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'REJECTED',
            rejectionReason: expect.stringContaining('조건 정의'),
          }),
        }),
      );
    });

    it('rejects when request_window is a past date', async (): Promise<void> => {
      const payload = makeValidPayload({ request_window: '2020-01-01' });
      setupCreateWithPayload(payload);

      await createFormSubmission({ responseId: 'resp-5', rawPayload: payload });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'REJECTED',
            rejectionReason: expect.stringContaining('날짜'),
          }),
        }),
      );
    });

    it('includes all rejection reasons when multiple fields fail', async (): Promise<void> => {
      const payload = {
        contact_channel: '전화',
        billing_consent: false,
        scope_consent: false,
      };
      setupCreateWithPayload(payload);

      await createFormSubmission({ responseId: 'resp-6', rawPayload: payload });

      const updateCall = mockUpdate.mock.calls[0][0];
      const reason = updateCall.data.rejectionReason as string;
      expect(reason).toContain(';');
      // 여러 오류가 세미콜론으로 구분되어 포함
      expect(reason.split(';').length).toBeGreaterThan(1);
    });

    it('extracts fields when all validations pass', async (): Promise<void> => {
      const payload = makeValidPayload();
      setupCreateWithPayload(payload);

      await createFormSubmission({ responseId: 'resp-7', rawPayload: payload });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            extractedFields: expect.objectContaining({
              contact_channel: '카카오톡',
              target_url: 'https://www.airbnb.com/rooms/12345',
              billing_consent: true,
              scope_consent: true,
            }),
          }),
        }),
      );
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
      const rows = [makeRow({ id: 'sub-1' }), makeRow({ id: 'sub-2' }), makeRow({ id: 'sub-3' })];
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

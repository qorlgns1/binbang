import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFormSubmission, getFormSubmissionById, getFormSubmissions } from './intake.service';

const { mockCreate, mockFindUnique, mockFindUniqueOrThrow, mockFindMany, mockCount, mockUpdate, mockTransaction } =
  vi.hoisted(
    (): {
      mockCreate: ReturnType<typeof vi.fn>;
      mockFindUnique: ReturnType<typeof vi.fn>;
      mockFindUniqueOrThrow: ReturnType<typeof vi.fn>;
      mockFindMany: ReturnType<typeof vi.fn>;
      mockCount: ReturnType<typeof vi.fn>;
      mockUpdate: ReturnType<typeof vi.fn>;
      mockTransaction: ReturnType<typeof vi.fn>;
    } => ({
      mockCreate: vi.fn(),
      mockFindUnique: vi.fn(),
      mockFindUniqueOrThrow: vi.fn(),
      mockFindMany: vi.fn(),
      mockCount: vi.fn(),
      mockUpdate: vi.fn(),
      mockTransaction: vi.fn(),
    }),
  );

vi.mock('@workspace/db', () => ({
  prisma: {
    formSubmission: {
      create: mockCreate,
      findUnique: mockFindUnique,
      findUniqueOrThrow: mockFindUniqueOrThrow,
      findMany: mockFindMany,
      count: mockCount,
      update: mockUpdate,
    },
    $transaction: mockTransaction,
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
    consentBillingOnConditionMet: null,
    consentServiceScope: null,
    consentCapturedAt: null,
    consentTexts: null,
    receivedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function setupTransactionMock(): void {
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    const tx = {
      formSubmission: {
        create: mockCreate,
        findUnique: mockFindUnique,
        findUniqueOrThrow: mockFindUniqueOrThrow,
        update: mockUpdate,
      },
    };
    return fn(tx);
  });
}

describe('intake.service', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({ id: 'sub-1' });
    setupTransactionMock();
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
      mockFindUniqueOrThrow.mockResolvedValue(updatedRow);

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
      expect(mockFindUniqueOrThrow).toHaveBeenCalledOnce();
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
      mockFindUniqueOrThrow.mockResolvedValue(rejectedRow);

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
      mockFindUniqueOrThrow.mockResolvedValue(row);
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

    it('stores consent evidence fields when all validations pass', async (): Promise<void> => {
      const payload = makeValidPayload();
      setupCreateWithPayload(payload);

      await createFormSubmission({ responseId: 'resp-consent-1', rawPayload: payload });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            consentBillingOnConditionMet: true,
            consentServiceScope: true,
            consentCapturedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('stores consent texts with checkbox originals when valid', async (): Promise<void> => {
      const payload = makeValidPayload();
      setupCreateWithPayload(payload);

      await createFormSubmission({ responseId: 'resp-consent-2', rawPayload: payload });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            consentTexts: {
              billing: '조건 충족(열림 확인) 시 비용이 발생함에 동의합니다',
              scope:
                '서비스는 Q4에 명시된 조건의 충족(열림) 여부만 확인하며, 예약 완료나 결제를 보장하지 않음에 동의합니다',
            },
          }),
        }),
      );
    });

    it('stores consent texts from payload when provided', async (): Promise<void> => {
      const payload = makeValidPayload({
        form_version: 'v_test_1',
        consent_texts: {
          billing: '동의문구(원문) - billing',
          scope: '동의문구(원문) - scope',
        },
      });
      setupCreateWithPayload(payload);

      await createFormSubmission({ responseId: 'resp-consent-payload-1', rawPayload: payload });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            formVersion: 'v_test_1',
            consentTexts: {
              billing: '동의문구(원문) - billing',
              scope: '동의문구(원문) - scope',
            },
          }),
        }),
      );
    });

    it('does not store consent fields when validation fails', async (): Promise<void> => {
      const payload = makeValidPayload({ billing_consent: false });
      setupCreateWithPayload(payload);

      await createFormSubmission({ responseId: 'resp-consent-3', rawPayload: payload });

      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.data.status).toBe('REJECTED');
      expect(updateCall.data.consentBillingOnConditionMet).toBeUndefined();
      expect(updateCall.data.consentServiceScope).toBeUndefined();
      expect(updateCall.data.consentCapturedAt).toBeUndefined();
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

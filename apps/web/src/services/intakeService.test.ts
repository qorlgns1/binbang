import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFormSubmission, getFormSubmissionById, getFormSubmissions } from './intakeService';

const {
  mockCreate,
  mockFindUnique,
  mockFindUniqueOrThrow,
  mockFindMany,
  mockCount,
  mockUpdate,
  mockTransaction,
  mockFindMappings,
} = vi.hoisted(
  (): {
    mockCreate: ReturnType<typeof vi.fn>;
    mockFindUnique: ReturnType<typeof vi.fn>;
    mockFindUniqueOrThrow: ReturnType<typeof vi.fn>;
    mockFindMany: ReturnType<typeof vi.fn>;
    mockCount: ReturnType<typeof vi.fn>;
    mockUpdate: ReturnType<typeof vi.fn>;
    mockTransaction: ReturnType<typeof vi.fn>;
    mockFindMappings: ReturnType<typeof vi.fn>;
  } => ({
    mockCreate: vi.fn(),
    mockFindUnique: vi.fn(),
    mockFindUniqueOrThrow: vi.fn(),
    mockFindMany: vi.fn(),
    mockCount: vi.fn(),
    mockUpdate: vi.fn(),
    mockTransaction: vi.fn(),
    mockFindMappings: vi.fn(),
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
    formQuestionMapping: {
      findMany: mockFindMappings,
    },
    $transaction: mockTransaction,
  },
}));

const NOW = new Date('2026-02-11T10:00:00.000Z');
const FUTURE_DATE = '2026-12-31';
const BILLING_CONSENT_TEXT = '요청한 조건이 충족된 시점(열림 확인)에 비용이 발생하는 것에 동의합니다.';
const SCOPE_CONSENT_TEXT = 'Q4에 제가 작성한 조건을 기준으로 열림 여부만 확인하는 서비스임을 이해합니다.';
const ITEM_ID_BY_FIELD = {
  CONTACT_CHANNEL: '213884063',
  CONTACT_VALUE: '1829594974',
  TARGET_URL: '1796020129',
  CONDITION_DEFINITION: '2147170575',
  REQUEST_WINDOW: '497499214',
  CHECK_FREQUENCY: '987005071',
  CONSENT: '1953936343',
} as const;

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

function makeAnswerBasedPayload(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    respondentEmail: 'respondent@example.com',
    answers: [
      { title: 'Q1. 연락 받을 방법 (필수)', value: '카카오톡' },
      { title: 'Q2. 카카오톡 아이디 또는 이메일 (필수)', value: 'user123' },
      { title: 'Q3. 확인할 링크(URL)를 붙여주세요', value: 'https://www.airbnb.com/rooms/12345' },
      {
        title: 'Q4. 어떤 상태가 되면 조건 충족(열림 확인)으로 볼지 정확히 써주세요',
        value: '2인 기준 1박 30만원 이하로 예약 가능한 상태',
      },
      { title: 'Q5. 언제까지 확인하면 되나요? (필수)', value: FUTURE_DATE },
      { title: 'Q6. 확인 빈도', value: '30분마다' },
      {
        title: 'Q7. 조건 충족(열림 확인) 시 비용 발생에 대한 동의',
        value: [BILLING_CONSENT_TEXT, SCOPE_CONSENT_TEXT],
      },
    ],
    ...overrides,
  };
}

function makeQuestionMappings(formKey = '*') {
  return [
    {
      formKey,
      field: 'CONTACT_CHANNEL',
      questionItemId: null,
      questionTitle: 'Q1. 연락 받을 방법 (필수)',
      expectedAnswer: null,
    },
    {
      formKey,
      field: 'CONTACT_VALUE',
      questionItemId: null,
      questionTitle: 'Q2. 카카오톡 아이디 또는 이메일 (필수)',
      expectedAnswer: null,
    },
    {
      formKey,
      field: 'TARGET_URL',
      questionItemId: null,
      questionTitle: 'Q3. 확인할 링크(URL)를 붙여주세요',
      expectedAnswer: null,
    },
    {
      formKey,
      field: 'CONDITION_DEFINITION',
      questionItemId: null,
      questionTitle: 'Q4. 어떤 상태가 되면 조건 충족(열림 확인)으로 볼지 정확히 써주세요',
      expectedAnswer: null,
    },
    {
      formKey,
      field: 'REQUEST_WINDOW',
      questionItemId: null,
      questionTitle: 'Q5. 언제까지 확인하면 되나요? (필수)',
      expectedAnswer: null,
    },
    {
      formKey,
      field: 'CHECK_FREQUENCY',
      questionItemId: null,
      questionTitle: 'Q6. 확인 빈도',
      expectedAnswer: null,
    },
    {
      formKey,
      field: 'BILLING_CONSENT',
      questionItemId: null,
      questionTitle: 'Q7. 조건 충족(열림 확인) 시 비용 발생에 대한 동의',
      expectedAnswer: BILLING_CONSENT_TEXT,
    },
    {
      formKey,
      field: 'SCOPE_CONSENT',
      questionItemId: null,
      questionTitle: 'Q7. 조건 충족(열림 확인) 시 비용 발생에 대한 동의',
      expectedAnswer: SCOPE_CONSENT_TEXT,
    },
  ];
}

function makeQuestionMappingsWithItemIds(formKey = '*') {
  return [
    {
      formKey,
      field: 'CONTACT_CHANNEL',
      questionItemId: ITEM_ID_BY_FIELD.CONTACT_CHANNEL,
      questionTitle: 'Q1. 연락 받을 방법 (필수)',
      expectedAnswer: null,
    },
    {
      formKey,
      field: 'CONTACT_VALUE',
      questionItemId: ITEM_ID_BY_FIELD.CONTACT_VALUE,
      questionTitle: 'Q2. 카카오톡 아이디 또는 이메일 (필수)',
      expectedAnswer: null,
    },
    {
      formKey,
      field: 'TARGET_URL',
      questionItemId: ITEM_ID_BY_FIELD.TARGET_URL,
      questionTitle: 'Q3. 확인할 링크(URL)를 붙여주세요',
      expectedAnswer: null,
    },
    {
      formKey,
      field: 'CONDITION_DEFINITION',
      questionItemId: ITEM_ID_BY_FIELD.CONDITION_DEFINITION,
      questionTitle: 'Q4. 어떤 상태가 되면 조건 충족(열림 확인)으로 볼지 정확히 써주세요',
      expectedAnswer: null,
    },
    {
      formKey,
      field: 'REQUEST_WINDOW',
      questionItemId: ITEM_ID_BY_FIELD.REQUEST_WINDOW,
      questionTitle: 'Q5. 언제까지 확인하면 되나요? (필수)',
      expectedAnswer: null,
    },
    {
      formKey,
      field: 'CHECK_FREQUENCY',
      questionItemId: ITEM_ID_BY_FIELD.CHECK_FREQUENCY,
      questionTitle: 'Q6. 확인 빈도',
      expectedAnswer: null,
    },
    {
      formKey,
      field: 'BILLING_CONSENT',
      questionItemId: ITEM_ID_BY_FIELD.CONSENT,
      questionTitle: 'Q7. 조건 충족(열림 확인) 시 비용 발생에 대한 동의',
      expectedAnswer: BILLING_CONSENT_TEXT,
    },
    {
      formKey,
      field: 'SCOPE_CONSENT',
      questionItemId: ITEM_ID_BY_FIELD.CONSENT,
      questionTitle: 'Q7. 조건 충족(열림 확인) 시 비용 발생에 대한 동의',
      expectedAnswer: SCOPE_CONSENT_TEXT,
    },
  ];
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
      formQuestionMapping: {
        findMany: mockFindMappings,
      },
    };
    return fn(tx);
  });
}

describe('intake.service', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({ id: 'sub-1' });
    mockFindMappings.mockResolvedValue([]);
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

    it('marks submission as NEEDS_REVIEW when payload has non-consent validation failures', async (): Promise<void> => {
      const payload = { contact_channel: '카카오톡', billing_consent: false };
      const row = makeRow({ rawPayload: payload });
      const rejectedRow = makeRow({
        rawPayload: payload,
        status: 'NEEDS_REVIEW',
        rejectionReason: 'some reason',
      });

      mockCreate.mockResolvedValue(row);
      mockFindUniqueOrThrow.mockResolvedValue(rejectedRow);

      const result = await createFormSubmission({
        responseId: 'resp-abc',
        rawPayload: payload,
      });

      expect(result.created).toBe(true);
      expect(result.submission.status).toBe('NEEDS_REVIEW');
      expect(result.submission.rejectionReason).toBeTruthy();
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'NEEDS_REVIEW' }),
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
            status: 'NEEDS_REVIEW',
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
            status: 'NEEDS_REVIEW',
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
            status: 'NEEDS_REVIEW',
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
      expect(updateCall.data.status).toBe('NEEDS_REVIEW');
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

    it('maps answers[] payload into canonical fields', async (): Promise<void> => {
      const payload = makeAnswerBasedPayload();
      setupCreateWithPayload(payload);
      mockFindMappings.mockResolvedValue(makeQuestionMappings());

      await createFormSubmission({ responseId: 'resp-answer-1', rawPayload: payload });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            extractedFields: expect.objectContaining({
              contact_channel: '카카오톡',
              contact_value: 'user123',
              target_url: 'https://www.airbnb.com/rooms/12345',
              request_window: FUTURE_DATE,
              billing_consent: true,
              scope_consent: true,
            }),
          }),
        }),
      );
    });

    it('uses itemId mapping first even when title changes', async (): Promise<void> => {
      const payload = makeAnswerBasedPayload({
        answers: [
          { itemId: ITEM_ID_BY_FIELD.CONTACT_CHANNEL, title: 'Q1. 연락 수단', value: '카카오톡' },
          { itemId: ITEM_ID_BY_FIELD.CONTACT_VALUE, title: 'Q2. 전화번호 또는 이메일 (필수)', value: 'user123' },
          { itemId: ITEM_ID_BY_FIELD.TARGET_URL, title: 'Q3. 링크', value: 'https://www.airbnb.com/rooms/12345' },
          {
            itemId: ITEM_ID_BY_FIELD.CONDITION_DEFINITION,
            title: 'Q4. 열림 판단 기준',
            value: '2인 기준 1박 30만원 이하로 예약 가능한 상태',
          },
          { itemId: ITEM_ID_BY_FIELD.REQUEST_WINDOW, title: 'Q5. 확인 종료일', value: FUTURE_DATE },
          { itemId: ITEM_ID_BY_FIELD.CHECK_FREQUENCY, title: 'Q6. 빈도', value: '30분마다' },
          {
            itemId: ITEM_ID_BY_FIELD.CONSENT,
            title: 'Q7. 동의',
            value: [BILLING_CONSENT_TEXT, SCOPE_CONSENT_TEXT],
          },
        ],
      });
      setupCreateWithPayload(payload);
      mockFindMappings.mockResolvedValue(makeQuestionMappingsWithItemIds());

      await createFormSubmission({ responseId: 'resp-answer-itemid-1', rawPayload: payload });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            extractedFields: expect.objectContaining({
              contact_channel: '카카오톡',
              contact_value: 'user123',
              target_url: 'https://www.airbnb.com/rooms/12345',
            }),
          }),
        }),
      );
    });

    it('marks as NEEDS_REVIEW when itemId mismatches and falls back to title', async (): Promise<void> => {
      const payload = makeAnswerBasedPayload({
        answers: [
          { itemId: '9991', title: 'Q1. 연락 받을 방법 (필수)', value: '카카오톡' },
          { itemId: '9992', title: 'Q2. 카카오톡 아이디 또는 이메일 (필수)', value: 'user123' },
          { itemId: '9993', title: 'Q3. 확인할 링크(URL)를 붙여주세요', value: 'https://www.airbnb.com/rooms/12345' },
          {
            itemId: '9994',
            title: 'Q4. 어떤 상태가 되면 조건 충족(열림 확인)으로 볼지 정확히 써주세요',
            value: '2인 기준 1박 30만원 이하로 예약 가능한 상태',
          },
          { itemId: '9995', title: 'Q5. 언제까지 확인하면 되나요? (필수)', value: FUTURE_DATE },
          { itemId: '9996', title: 'Q6. 확인 빈도', value: '30분마다' },
          {
            itemId: '9997',
            title: 'Q7. 조건 충족(열림 확인) 시 비용 발생에 대한 동의',
            value: [BILLING_CONSENT_TEXT, SCOPE_CONSENT_TEXT],
          },
        ],
      });
      setupCreateWithPayload(payload);
      mockFindMappings.mockResolvedValue(makeQuestionMappingsWithItemIds());

      await createFormSubmission({ responseId: 'resp-answer-itemid-2', rawPayload: payload });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'NEEDS_REVIEW',
            rejectionReason: expect.stringContaining('CONTACT_CHANNEL: itemId'),
            extractedFields: expect.objectContaining({
              mapping_warnings: expect.arrayContaining([expect.stringContaining('title fallback')]),
            }),
          }),
        }),
      );
    });

    it('falls back to respondentEmail when contact value answer is missing', async (): Promise<void> => {
      const payload = makeAnswerBasedPayload({
        answers: [
          { title: 'Q1. 연락 받을 방법 (필수)', value: '이메일' },
          { title: 'Q3. 확인할 링크(URL)를 붙여주세요', value: 'https://www.airbnb.com/rooms/12345' },
          {
            title: 'Q4. 어떤 상태가 되면 조건 충족(열림 확인)으로 볼지 정확히 써주세요',
            value: '2인 기준 1박 30만원 이하로 예약 가능한 상태',
          },
          { title: 'Q5. 언제까지 확인하면 되나요? (필수)', value: FUTURE_DATE },
          {
            title: 'Q7. 조건 충족(열림 확인) 시 비용 발생에 대한 동의',
            value: [BILLING_CONSENT_TEXT, SCOPE_CONSENT_TEXT],
          },
        ],
      });
      setupCreateWithPayload(payload);
      mockFindMappings.mockResolvedValue(makeQuestionMappings());

      await createFormSubmission({ responseId: 'resp-answer-2', rawPayload: payload });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            extractedFields: expect.objectContaining({
              contact_channel: '이메일',
              contact_value: 'respondent@example.com',
            }),
          }),
        }),
      );
    });

    it('marks as NEEDS_REVIEW when mapped title does not exactly match', async (): Promise<void> => {
      const payload = makeAnswerBasedPayload({
        answers: [
          { title: 'Q1. 연락받을방법 (필수)', value: '카카오톡' }, // 정확 일치 실패
          { title: 'Q2. 카카오톡 아이디 또는 이메일 (필수)', value: 'user123' },
          { title: 'Q3. 확인할 링크(URL)를 붙여주세요', value: 'https://www.airbnb.com/rooms/12345' },
          {
            title: 'Q4. 어떤 상태가 되면 조건 충족(열림 확인)으로 볼지 정확히 써주세요',
            value: '2인 기준 1박 30만원 이하로 예약 가능한 상태',
          },
          { title: 'Q5. 언제까지 확인하면 되나요? (필수)', value: FUTURE_DATE },
          { title: 'Q6. 확인 빈도', value: '30분마다' },
          {
            title: 'Q7. 조건 충족(열림 확인) 시 비용 발생에 대한 동의',
            value: [BILLING_CONSENT_TEXT, SCOPE_CONSENT_TEXT],
          },
        ],
      });
      setupCreateWithPayload(payload);
      mockFindMappings.mockResolvedValue(makeQuestionMappings());

      await createFormSubmission({ responseId: 'resp-answer-3', rawPayload: payload });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'NEEDS_REVIEW',
            rejectionReason: expect.stringContaining('contact_channel'),
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

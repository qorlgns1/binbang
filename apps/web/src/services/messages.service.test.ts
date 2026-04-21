import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MESSAGE_TEMPLATES,
  createCaseMessage,
  getCaseMessages,
  getOperatorMessageStats,
  getTemplateByKey,
} from './messages.service';

const dbMock = vi.hoisted(
  (): {
    dataSource: {
      query: ReturnType<typeof vi.fn>;
    };
    caseRepo: {
      findOne: ReturnType<typeof vi.fn>;
    };
    caseMessageRepo: {
      create: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      find: ReturnType<typeof vi.fn>;
      save: ReturnType<typeof vi.fn>;
    };
    getDataSource: ReturnType<typeof vi.fn>;
  } => ({
    dataSource: {
      query: vi.fn(),
    },
    caseRepo: {
      findOne: vi.fn(),
    },
    caseMessageRepo: {
      create: vi.fn(),
      count: vi.fn(),
      find: vi.fn(),
      save: vi.fn(),
    },
    getDataSource: vi.fn(),
  }),
);

vi.mock('@workspace/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@workspace/db')>();
  const { createMockDataSource, createMockRepository } = await import('../../../../test-utils/mock-db.ts');

  const caseRepo = createMockRepository();
  const caseMessageRepo = createMockRepository();
  caseMessageRepo.save.mockImplementation(async (entity: Record<string, unknown>) => entity);

  const dataSource = createMockDataSource({
    repositories: [
      [actual.Case, caseRepo],
      [actual.CaseMessage, caseMessageRepo],
    ],
  });

  dbMock.dataSource = dataSource;
  dbMock.caseRepo = caseRepo;
  dbMock.caseMessageRepo = caseMessageRepo;
  dbMock.getDataSource.mockResolvedValue(dataSource);

  return {
    ...actual,
    getDataSource: dbMock.getDataSource,
  };
});

const NOW = new Date('2026-02-13T00:00:00.000Z');

function buildMessageRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'msg-1',
    templateKey: 'intake_confirm',
    channel: 'MANUAL_COPY',
    content: '접수 확인 테스트',
    sentById: 'admin-1',
    createdAt: NOW,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  dbMock.getDataSource.mockResolvedValue(dbMock.dataSource);
});

describe('MESSAGE_TEMPLATES', () => {
  it('should have exactly 6 templates', () => {
    expect(MESSAGE_TEMPLATES).toHaveLength(6);
  });

  it('should have 3 operation + 3 dispute templates', () => {
    const ops = MESSAGE_TEMPLATES.filter((t) => t.category === 'operation');
    const disputes = MESSAGE_TEMPLATES.filter((t) => t.category === 'dispute');
    expect(ops).toHaveLength(3);
    expect(disputes).toHaveLength(3);
  });

  it('should have unique keys', () => {
    const keys = MESSAGE_TEMPLATES.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('price_quote template should include finalPrice', () => {
    const template = getTemplateByKey('price_quote');
    expect(template).toBeDefined();
    if (!template) {
      throw new Error('price_quote template is required');
    }
    const content = template.buildContent({ finalPrice: 43000 });
    expect(content).toContain('43,000원');
  });

  it('price_quote template should default to 0 without params', () => {
    const template = getTemplateByKey('price_quote');
    expect(template).toBeDefined();
    if (!template) {
      throw new Error('price_quote template is required');
    }
    const content = template.buildContent();
    expect(content).toContain('0원');
  });

  it('getTemplateByKey should return undefined for unknown key', () => {
    expect(getTemplateByKey('unknown')).toBeUndefined();
  });
});

describe('createCaseMessage', () => {
  const input = {
    caseId: 'case-1',
    templateKey: 'intake_confirm',
    channel: 'MANUAL_COPY',
    content: '접수 확인 테스트',
    sentById: 'admin-1',
  };

  it('should create a message and return output with ISO date', async () => {
    dbMock.caseRepo.findOne.mockResolvedValue({ id: 'case-1' });
    dbMock.caseMessageRepo.create.mockImplementation((data: Record<string, unknown>) => ({
      ...buildMessageRow(),
      ...data,
    }));

    const result = await createCaseMessage(input);

    expect(result.id).toBe('msg-1');
    expect(result.templateKey).toBe('intake_confirm');
    expect(result.createdAt).toBe(NOW.toISOString());
    expect(dbMock.caseMessageRepo.create).toHaveBeenCalledOnce();
  });

  it('should throw when case does not exist', async () => {
    dbMock.caseRepo.findOne.mockResolvedValue(null);

    await expect(createCaseMessage(input)).rejects.toThrow('Case not found');
    expect(dbMock.caseMessageRepo.create).not.toHaveBeenCalled();
  });
});

describe('getCaseMessages', () => {
  it('should return empty array when no messages', async () => {
    dbMock.caseMessageRepo.find.mockResolvedValue([]);

    const result = await getCaseMessages('case-1');
    expect(result).toEqual([]);
  });

  it('should return messages sorted by createdAt desc', async () => {
    const msg1 = buildMessageRow({ id: 'msg-1', createdAt: new Date('2026-02-12T00:00:00Z') });
    const msg2 = buildMessageRow({ id: 'msg-2', createdAt: new Date('2026-02-13T00:00:00Z') });
    dbMock.caseMessageRepo.find.mockResolvedValue([msg2, msg1]);

    const result = await getCaseMessages('case-1');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('msg-2');
    expect(result[1].id).toBe('msg-1');
  });
});

describe('getOperatorMessageStats', () => {
  it('should return grouped stats', async () => {
    dbMock.dataSource.query.mockResolvedValue([
      { templateKey: 'intake_confirm', count: '5' },
      { templateKey: 'price_quote', count: '3' },
    ]);

    const result = await getOperatorMessageStats();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ templateKey: 'intake_confirm', count: 5 });
    expect(result[1]).toEqual({ templateKey: 'price_quote', count: 3 });
  });

  it('should filter by sentById when provided', async () => {
    dbMock.dataSource.query.mockResolvedValue([]);

    await getOperatorMessageStats('admin-1');

    expect(dbMock.dataSource.query).toHaveBeenCalledWith(expect.stringContaining('WHERE "sentById" = :1'), ['admin-1']);
  });

  it('should not filter when sentById is omitted', async () => {
    dbMock.dataSource.query.mockResolvedValue([]);

    await getOperatorMessageStats();

    expect(dbMock.dataSource.query).toHaveBeenCalledWith(expect.not.stringContaining('WHERE "sentById" = :1'), []);
  });
});

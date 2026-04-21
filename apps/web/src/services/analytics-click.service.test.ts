import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createLandingClickEvent } from './analytics-click.service';

const dbMock = vi.hoisted(
  (): {
    dataSource: unknown;
    landingEventRepo: {
      create: ReturnType<typeof vi.fn>;
      save: ReturnType<typeof vi.fn>;
    };
    getDataSource: ReturnType<typeof vi.fn>;
  } => ({
    dataSource: null,
    landingEventRepo: {
      create: vi.fn(),
      save: vi.fn(),
    },
    getDataSource: vi.fn(),
  }),
);

vi.mock('@workspace/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@workspace/db')>();
  const { createMockDataSource, createMockRepository } = await import('../../../../test-utils/mock-db.ts');

  const landingEventRepo = createMockRepository();
  landingEventRepo.save.mockImplementation(async (entity: Record<string, unknown>) => entity);
  const dataSource = createMockDataSource({
    repositories: [[actual.LandingEvent, landingEventRepo]],
  });

  dbMock.dataSource = dataSource;
  dbMock.landingEventRepo = landingEventRepo;
  dbMock.getDataSource.mockResolvedValue(dataSource);

  return {
    ...actual,
    getDataSource: dbMock.getDataSource,
  };
});

describe('analytics-click.service', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    dbMock.getDataSource.mockResolvedValue(dbMock.dataSource);
  });

  afterEach((): void => {
    vi.useRealTimers();
  });

  it('persists click event and returns normalized payload', async (): Promise<void> => {
    dbMock.landingEventRepo.create.mockImplementation((data: Record<string, unknown>) => ({
      id: 'evt_1',
      ...data,
    }));

    const result = await createLandingClickEvent({
      eventName: 'nav_pricing',
      source: 'public_header_desktop',
      sessionId: 'session_1',
      locale: 'ko',
      path: '/ko',
      occurredAt: '2026-02-14T01:02:03.000Z',
      referrer: 'https://example.com',
      userAgent: 'ua',
      ipAddress: '127.0.0.1',
    });

    expect(dbMock.landingEventRepo.create).toHaveBeenCalledWith({
      eventName: 'nav_pricing',
      source: 'public_header_desktop',
      sessionId: 'session_1',
      locale: 'ko',
      path: '/ko',
      referrer: 'https://example.com',
      userAgent: 'ua',
      ipAddress: '127.0.0.1',
      occurredAt: new Date('2026-02-14T01:02:03.000Z'),
    });

    expect(result).toEqual({
      eventId: 'evt_1',
      eventName: 'nav_pricing',
      occurredAt: '2026-02-14T01:02:03.000Z',
    });
  });

  it('defaults path and occurredAt when omitted', async (): Promise<void> => {
    const now = new Date('2026-02-14T02:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    dbMock.landingEventRepo.create.mockImplementation((data: Record<string, unknown>) => ({
      id: 'evt_2',
      ...data,
    }));

    await createLandingClickEvent({
      eventName: 'nav_request',
    });

    expect(dbMock.landingEventRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/',
        occurredAt: now,
      }),
    );
  });

  it('falls back to current time when occurredAt is invalid', async (): Promise<void> => {
    const now = new Date('2026-02-14T03:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    dbMock.landingEventRepo.create.mockImplementation((data: Record<string, unknown>) => ({
      id: 'evt_3',
      ...data,
    }));

    await createLandingClickEvent({
      eventName: 'nav_signup',
      occurredAt: 'invalid-date',
    });

    expect(dbMock.landingEventRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        occurredAt: now,
      }),
    );
  });
});

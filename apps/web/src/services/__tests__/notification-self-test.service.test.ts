import { beforeEach, describe, expect, it, vi } from 'vitest';

import { runNotificationSelfTest } from '../notification-self-test.service';

const { mockFindAccommodations, mockSaveEvent, mockSaveNotifications, mockRollback, mockRelease } = vi.hoisted(() => ({
  mockFindAccommodations: vi.fn(),
  mockSaveEvent: vi.fn(),
  mockSaveNotifications: vi.fn(),
  mockRollback: vi.fn(),
  mockRelease: vi.fn(),
}));

vi.mock('@workspace/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@workspace/db')>();

  const manager = {
    getRepository: (entity: unknown) => {
      if (entity === actual.Accommodation) {
        return { find: mockFindAccommodations };
      }
      if (entity === actual.AgodaAlertEvent) {
        return { create: (input: Record<string, unknown>) => ({ ...input }), save: mockSaveEvent };
      }
      throw new Error('unexpected repository');
    },
  };

  const queryRunner = {
    manager,
    connect: vi.fn(),
    startTransaction: vi.fn(),
    rollbackTransaction: mockRollback,
    release: mockRelease,
  };

  return {
    ...actual,
    getDataSource: vi.fn().mockResolvedValue({ createQueryRunner: () => queryRunner }),
  };
});

vi.mock('@/services/agoda-polling.service', () => ({
  saveQueuedEmailNotifications: mockSaveNotifications,
}));

describe('runNotificationSelfTest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindAccommodations.mockResolvedValue([{ id: 'acc1' }]);
    mockSaveEvent.mockImplementation(async (event: { id?: number }) => {
      event.id = 7;
      return event;
    });
    mockSaveNotifications.mockResolvedValue(1);
  });

  it('이벤트와 알림을 저장한 뒤 항상 롤백한다', async () => {
    const result = await runNotificationSelfTest();

    expect(result.status).toBe('passed');
    expect(mockSaveNotifications).toHaveBeenCalledWith(expect.anything(), {
      accommodationId: 'acc1',
      alertEventIds: [7],
    });
    expect(mockRollback).toHaveBeenCalledTimes(1);
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

  it('알림 저장이 실패하면 failed와 오류를 돌려주고 롤백한다', async () => {
    mockSaveNotifications.mockRejectedValue(
      Object.assign(new Error('Cyclic dependency: "d"'), { name: 'TypeORMError' }),
    );

    const result = await runNotificationSelfTest();

    expect(result).toMatchObject({ status: 'failed', error: 'TypeORMError: Cyclic dependency: "d"' });
    expect(mockRollback).toHaveBeenCalledTimes(1);
  });

  it('저장 후 이벤트 ID를 못 받으면 failed다', async () => {
    mockSaveEvent.mockImplementation(async (event: unknown) => event);

    const result = await runNotificationSelfTest();

    expect(result.status).toBe('failed');
    expect(mockSaveNotifications).not.toHaveBeenCalled();
  });

  it('숙소가 하나도 없으면 건너뛴다', async () => {
    mockFindAccommodations.mockResolvedValue([]);

    const result = await runNotificationSelfTest();

    expect(result.status).toBe('skipped');
    expect(mockRollback).toHaveBeenCalledTimes(1);
  });
});

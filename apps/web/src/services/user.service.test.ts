import { beforeEach, describe, expect, it, vi } from 'vitest';

import { completeTutorial, dismissTutorial, getTutorialStatus } from './user.service';

const dbMock = vi.hoisted(
  (): {
    dataSource: unknown;
    userRepo: {
      findOne: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    getDataSource: ReturnType<typeof vi.fn>;
  } => ({
    dataSource: null,
    userRepo: {
      findOne: vi.fn(),
      update: vi.fn(),
    },
    getDataSource: vi.fn(),
  }),
);

vi.mock('@workspace/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@workspace/db')>();
  const { createMockDataSource, createMockRepository } = await import('../../../../test-utils/mock-db.ts');

  const userRepo = createMockRepository();
  userRepo.update.mockImplementation((where, data) => ({ where, data }));
  const dataSource = createMockDataSource({
    repositories: [[actual.User, userRepo]],
  });

  dbMock.dataSource = dataSource;
  dbMock.userRepo = userRepo;
  dbMock.getDataSource.mockResolvedValue(dataSource);

  return {
    ...actual,
    getDataSource: dbMock.getDataSource,
  };
});

describe('user.service - tutorial', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
    dbMock.getDataSource.mockResolvedValue(dbMock.dataSource);
  });

  describe('getTutorialStatus', (): void => {
    it('returns shouldShow: true when both fields are null', async (): Promise<void> => {
      dbMock.userRepo.findOne.mockResolvedValue({
        tutorialCompletedAt: null,
        tutorialDismissedAt: null,
      });

      const result = await getTutorialStatus('user-1');

      expect(dbMock.userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { tutorialCompletedAt: true, tutorialDismissedAt: true },
      });
      expect(result).toEqual({ shouldShow: true });
    });

    it('returns shouldShow: false when tutorialCompletedAt is set', async (): Promise<void> => {
      dbMock.userRepo.findOne.mockResolvedValue({
        tutorialCompletedAt: new Date('2026-01-01'),
        tutorialDismissedAt: null,
      });

      const result = await getTutorialStatus('user-1');

      expect(result).toEqual({ shouldShow: false });
    });

    it('returns shouldShow: false when tutorialDismissedAt is set', async (): Promise<void> => {
      dbMock.userRepo.findOne.mockResolvedValue({
        tutorialCompletedAt: null,
        tutorialDismissedAt: new Date('2026-01-01'),
      });

      const result = await getTutorialStatus('user-1');

      expect(result).toEqual({ shouldShow: false });
    });

    it('returns null when user is not found', async (): Promise<void> => {
      dbMock.userRepo.findOne.mockResolvedValue(null);

      const result = await getTutorialStatus('user-1');

      expect(result).toBeNull();
    });
  });

  describe('completeTutorial', (): void => {
    it('updates tutorialCompletedAt', async (): Promise<void> => {
      await completeTutorial('user-1');

      expect(dbMock.userRepo.update).toHaveBeenCalledWith({ id: 'user-1' }, { tutorialCompletedAt: expect.any(Date) });
    });
  });

  describe('dismissTutorial', (): void => {
    it('updates tutorialDismissedAt', async (): Promise<void> => {
      await dismissTutorial('user-1');

      expect(dbMock.userRepo.update).toHaveBeenCalledWith({ id: 'user-1' }, { tutorialDismissedAt: expect.any(Date) });
    });
  });
});

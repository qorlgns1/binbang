import { beforeEach, describe, expect, it, vi } from 'vitest';

import { completeTutorial, dismissTutorial, getTutorialStatus } from './userService';

const { mockFindUnique, mockUpdate } = vi.hoisted(
  (): {
    mockFindUnique: ReturnType<typeof vi.fn>;
    mockUpdate: ReturnType<typeof vi.fn>;
  } => ({
    mockFindUnique: vi.fn(),
    mockUpdate: vi.fn(),
  }),
);

vi.mock('@workspace/db', () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
  QuotaKey: { MAX_ACCOMMODATIONS: 'MAX_ACCOMMODATIONS', CHECK_INTERVAL_MIN: 'CHECK_INTERVAL_MIN' },
}));

describe('user.service - tutorial', (): void => {
  beforeEach((): void => {
    vi.clearAllMocks();
  });

  describe('getTutorialStatus', (): void => {
    it('returns shouldShow: true when both fields are null', async (): Promise<void> => {
      mockFindUnique.mockResolvedValue({
        tutorialCompletedAt: null,
        tutorialDismissedAt: null,
      });

      const result = await getTutorialStatus('user-1');

      expect(mockFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          select: { tutorialCompletedAt: true, tutorialDismissedAt: true },
        }),
      );
      expect(result).toEqual({ shouldShow: true });
    });

    it('returns shouldShow: false when tutorialCompletedAt is set', async (): Promise<void> => {
      mockFindUnique.mockResolvedValue({
        tutorialCompletedAt: new Date('2026-01-01'),
        tutorialDismissedAt: null,
      });

      const result = await getTutorialStatus('user-1');

      expect(result).toEqual({ shouldShow: false });
    });

    it('returns shouldShow: false when tutorialDismissedAt is set', async (): Promise<void> => {
      mockFindUnique.mockResolvedValue({
        tutorialCompletedAt: null,
        tutorialDismissedAt: new Date('2026-01-01'),
      });

      const result = await getTutorialStatus('user-1');

      expect(result).toEqual({ shouldShow: false });
    });

    it('returns null when user is not found', async (): Promise<void> => {
      mockFindUnique.mockResolvedValue(null);

      const result = await getTutorialStatus('user-1');

      expect(result).toBeNull();
    });
  });

  describe('completeTutorial', (): void => {
    it('calls prisma.user.update with tutorialCompletedAt', async (): Promise<void> => {
      mockUpdate.mockResolvedValue({ id: 'user-1' });

      await completeTutorial('user-1');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { tutorialCompletedAt: expect.any(Date) },
          select: { id: true },
        }),
      );
    });
  });

  describe('dismissTutorial', (): void => {
    it('calls prisma.user.update with tutorialDismissedAt', async (): Promise<void> => {
      mockUpdate.mockResolvedValue({ id: 'user-1' });

      await dismissTutorial('user-1');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { tutorialDismissedAt: expect.any(Date) },
          select: { id: true },
        }),
      );
    });
  });
});

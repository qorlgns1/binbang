import { beforeEach, describe, expect, it, vi } from 'vitest';

import { checkMissingAgodaNotifications } from '../agoda-notification-watchdog.service';

const { mockMissedEvents, mockAdmins, mockSendAgodaAlertEmail } = vi.hoisted(() => ({
  mockMissedEvents: vi.fn(),
  mockAdmins: vi.fn(),
  mockSendAgodaAlertEmail: vi.fn(),
}));

vi.mock('@workspace/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@workspace/db')>();
  const { createMockDataSource, createMockRepository } = await import('../../../../../test-utils/mock-db.ts');

  const eventRepo = createMockRepository();
  eventRepo.queryBuilder.getMany.mockImplementation(() => mockMissedEvents());

  const userRepo = createMockRepository();
  userRepo.queryBuilder.getMany.mockImplementation(() => mockAdmins());

  const dataSource = createMockDataSource({
    repositories: [
      [actual.AgodaAlertEvent, eventRepo],
      [actual.User, userRepo],
    ],
  });

  return {
    ...actual,
    getDataSource: vi.fn().mockResolvedValue(dataSource),
  };
});

vi.mock('../agoda-email.service', () => ({
  sendAgodaAlertEmail: mockSendAgodaAlertEmail,
}));

const NOW = new Date('2026-10-30T03:45:00.000Z');

describe('checkMissingAgodaNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendAgodaAlertEmail.mockResolvedValue({ provider: 'console', messageId: 'm1' });
    mockAdmins.mockResolvedValue([{ id: 'admin1', email: 'admin@example.com' }]);
  });

  it('검사 창은 30분 전부터 그 이전 60분이다', async () => {
    mockMissedEvents.mockResolvedValue([]);

    const result = await checkMissingAgodaNotifications(NOW);

    expect(result.windowEnd).toBe('2026-10-30T03:15:00.000Z');
    expect(result.windowStart).toBe('2026-10-30T02:15:00.000Z');
  });

  it('누락이 없으면 경보 메일을 보내지 않는다', async () => {
    mockMissedEvents.mockResolvedValue([]);

    const result = await checkMissingAgodaNotifications(NOW);

    expect(result.missedCount).toBe(0);
    expect(result.alertedRecipients).toBe(0);
    expect(mockSendAgodaAlertEmail).not.toHaveBeenCalled();
  });

  it('알림 행이 없는 감지 이벤트가 있으면 관리자에게 경보 메일을 보낸다', async () => {
    mockMissedEvents.mockResolvedValue([
      { id: 421, accommodationId: 'acc1', type: 'vacancy', detectedAt: new Date('2026-10-30T02:30:00.000Z') },
    ]);

    const result = await checkMissingAgodaNotifications(NOW);

    expect(result.missedCount).toBe(1);
    expect(result.missedEventIds).toEqual(['421']);
    expect(result.alertedRecipients).toBe(1);
    expect(mockSendAgodaAlertEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'admin@example.com',
        subject: expect.stringContaining('1건'),
        text: expect.stringContaining('#421 vacancy'),
      }),
    );
  });

  it('경보 메일 발송이 실패해도 결과를 돌려준다', async () => {
    mockMissedEvents.mockResolvedValue([
      { id: 421, accommodationId: 'acc1', type: 'vacancy', detectedAt: new Date('2026-10-30T02:30:00.000Z') },
    ]);
    mockSendAgodaAlertEmail.mockRejectedValue(new Error('resend down'));

    const result = await checkMissingAgodaNotifications(NOW);

    expect(result.missedCount).toBe(1);
    expect(result.alertedRecipients).toBe(0);
  });
});

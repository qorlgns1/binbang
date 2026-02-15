import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createLandingClickEvent } from './analyticsClickService';

const { mockLandingEventCreate } = vi.hoisted(
  (): {
    mockLandingEventCreate: ReturnType<typeof vi.fn>;
  } => ({
    mockLandingEventCreate: vi.fn(),
  }),
);

vi.mock('@workspace/db', () => ({
  prisma: {
    landingEvent: {
      create: mockLandingEventCreate,
    },
  },
}));

describe('analytics-click.service', (): void => {
  beforeEach((): void => {
    mockLandingEventCreate.mockClear();
  });

  afterEach((): void => {
    vi.useRealTimers();
  });

  it('persists click event and returns normalized payload', async (): Promise<void> => {
    mockLandingEventCreate.mockResolvedValue({
      id: 'evt_1',
      eventName: 'nav_pricing',
      occurredAt: new Date('2026-02-14T01:02:03.000Z'),
    });

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

    expect(mockLandingEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventName: 'nav_pricing',
          source: 'public_header_desktop',
          sessionId: 'session_1',
          locale: 'ko',
          path: '/ko',
          referrer: 'https://example.com',
          userAgent: 'ua',
          ipAddress: '127.0.0.1',
          occurredAt: new Date('2026-02-14T01:02:03.000Z'),
        }),
      }),
    );

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

    mockLandingEventCreate.mockResolvedValue({
      id: 'evt_2',
      eventName: 'nav_request',
      occurredAt: now,
    });

    await createLandingClickEvent({
      eventName: 'nav_request',
    });

    expect(mockLandingEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          path: '/',
          occurredAt: now,
        }),
      }),
    );
  });

  it('falls back to current time when occurredAt is invalid', async (): Promise<void> => {
    const now = new Date('2026-02-14T03:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    mockLandingEventCreate.mockResolvedValue({
      id: 'evt_3',
      eventName: 'nav_signup',
      occurredAt: now,
    });

    await createLandingClickEvent({
      eventName: 'nav_signup',
      occurredAt: 'invalid-date',
    });

    expect(mockLandingEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          occurredAt: now,
        }),
      }),
    );
  });
});

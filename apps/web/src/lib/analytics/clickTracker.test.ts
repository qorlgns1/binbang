import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalWindow = globalThis.window;
const originalNavigator = globalThis.navigator;

function setupDomMocks(sendBeacon: ReturnType<typeof vi.fn>): void {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      location: {
        pathname: '/ko',
      },
    },
  });

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      sendBeacon,
    },
  });
}

describe('click-tracker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    });
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator,
    });
  });

  it('sends click event to analytics endpoint', async () => {
    const sendBeacon = vi.fn();
    setupDomMocks(sendBeacon);
    vi.resetModules();

    const { trackClickEvent } = await import('./clickTracker');

    trackClickEvent({
      eventName: 'nav_pricing',
      source: 'public_header_desktop',
      locale: 'ko',
    });

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(sendBeacon).toHaveBeenCalledWith('/api/analytics/click', expect.any(Blob));
  });

  it('drops duplicate event in dedupe window and allows resend later', async () => {
    const sendBeacon = vi.fn();
    setupDomMocks(sendBeacon);
    vi.resetModules();

    const { trackClickEvent } = await import('./clickTracker');

    trackClickEvent({
      eventName: 'mobile_menu_open',
      source: 'mobile_menu_trigger',
      locale: 'ko',
    });
    trackClickEvent({
      eventName: 'mobile_menu_open',
      source: 'mobile_menu_trigger',
      locale: 'ko',
    });

    expect(sendBeacon).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(900);
    trackClickEvent({
      eventName: 'mobile_menu_open',
      source: 'mobile_menu_trigger',
      locale: 'ko',
    });

    expect(sendBeacon).toHaveBeenCalledTimes(2);
  });
});

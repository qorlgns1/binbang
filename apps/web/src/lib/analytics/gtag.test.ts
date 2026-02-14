import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalWindow = globalThis.window;

describe('sendGa4Event', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    });
  });

  it('calls window.gtag with event name and params', async () => {
    const gtagMock = vi.fn();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { gtag: gtagMock },
    });

    const { sendGa4Event } = await import('./gtag');
    sendGa4Event('landing_viewed', { locale: 'ko' });

    expect(gtagMock).toHaveBeenCalledWith('event', 'landing_viewed', { locale: 'ko' });
  });

  it('no-ops when window.gtag is undefined (ad-blocker)', async () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {},
    });

    const { sendGa4Event } = await import('./gtag');
    expect(() => sendGa4Event('landing_viewed')).not.toThrow();
  });

  it('no-ops during SSR (window undefined)', async () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: undefined,
    });

    const { sendGa4Event } = await import('./gtag');
    expect(() => sendGa4Event('landing_viewed')).not.toThrow();
  });

  it('swallows errors thrown by gtag', async () => {
    const gtagMock = vi.fn(() => {
      throw new Error('gtag error');
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { gtag: gtagMock },
    });

    const { sendGa4Event } = await import('./gtag');
    expect(() => sendGa4Event('landing_viewed')).not.toThrow();
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createRequestId, logError, logInfo } from './logger';

afterEach((): void => {
  vi.restoreAllMocks();
});

describe('logger', () => {
  it('creates request ids with a stable prefix', () => {
    const requestId = createRequestId('dispatch');

    expect(requestId).toMatch(/^dispatch_\d{14}_\d{3}$/);
  });

  it('serializes structured info logs as JSON', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation((): undefined => undefined);

    logInfo('test_event', {
      requestId: 'req_123',
      count: 2,
      values: ['a', 'b'],
    });

    expect(infoSpy).toHaveBeenCalledOnce();
    const payload = JSON.parse(infoSpy.mock.calls[0]?.[0] as string) as Record<string, unknown>;
    expect(payload).toMatchObject({
      app: 'binbang-web',
      level: 'info',
      event: 'test_event',
      requestId: 'req_123',
      count: 2,
    });
  });

  it('serializes errors with name and message', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation((): undefined => undefined);

    logError('test_error', {
      error: new Error('boom'),
    });

    expect(errorSpy).toHaveBeenCalledOnce();
    const payload = JSON.parse(errorSpy.mock.calls[0]?.[0] as string) as {
      error: { name: string; message: string };
    };
    expect(payload.error).toMatchObject({
      name: 'Error',
      message: 'boom',
    });
  });
});

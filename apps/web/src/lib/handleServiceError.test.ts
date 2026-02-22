import { describe, expect, it, vi } from 'vitest';

import { AppError, ConflictError, InternalServerError, NotFoundError, ValidationError } from '@workspace/shared/errors';

import {
  badRequestResponse,
  handleServiceError,
  notFoundResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from './handleServiceError';

describe('handleServiceError', () => {
  it('maps NotFoundError to 404', async () => {
    const res = handleServiceError(new NotFoundError('User not found'));
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('User not found');
  });

  it('maps ConflictError to 409', async () => {
    const res = handleServiceError(new ConflictError('Already exists'));
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.error.code).toBe('CONFLICT');
  });

  it('maps ValidationError with details', async () => {
    const details = [{ field: 'email', message: 'Invalid email' }];
    const res = handleServiceError(new ValidationError('Invalid input', details));
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toEqual(details);
  });

  it('maps custom AppError with arbitrary status', async () => {
    const res = handleServiceError(new AppError('Rate limited', 429, 'RATE_LIMITED'));
    expect(res.status).toBe(429);

    const body = await res.json();
    expect(body.error.code).toBe('RATE_LIMITED');
  });

  it('maps InternalServerError to 500 with expected code', async () => {
    const res = handleServiceError(new InternalServerError());
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(body.error.message).toBe('Internal server error');
  });

  it('maps unknown Error to 500 and logs', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation((): void => {});

    const res = handleServiceError(new Error('boom'), 'Test prefix');
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(body.error.message).toBe('Internal server error');

    expect(spy).toHaveBeenCalledWith('Test prefix:', expect.any(Error));
    spy.mockRestore();
  });

  it('maps non-Error values to 500', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation((): void => {});

    const res = handleServiceError('string error');
    expect(res.status).toBe(500);

    spy.mockRestore();
  });

  it('does not include details for non-ValidationError AppError', async () => {
    const res = handleServiceError(new NotFoundError('missing'));
    const body = await res.json();
    expect(body.error.details).toBeUndefined();
  });
});

describe('unauthorizedResponse', () => {
  it('returns 401 with UNAUTHORIZED code and default message', async () => {
    const res = unauthorizedResponse();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.message).toBe('Unauthorized');
  });

  it('returns 401 with custom message', async () => {
    const res = unauthorizedResponse('Custom unauthorized');
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.message).toBe('Custom unauthorized');
  });
});

describe('badRequestResponse', () => {
  it('returns 400 with BAD_REQUEST code', async () => {
    const res = badRequestResponse('Invalid input');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('BAD_REQUEST');
    expect(body.error.message).toBe('Invalid input');
    expect(body.error.details).toBeUndefined();
  });

  it('includes details when provided', async () => {
    const details = { field: 'name' };
    const res = badRequestResponse('Bad request', details);
    const body = await res.json();
    expect(body.error.details).toEqual(details);
  });
});

describe('validationErrorResponse', () => {
  it('returns 400 with VALIDATION_ERROR code and details', async () => {
    const details = [{ path: 'email', message: 'Required' }];
    const res = validationErrorResponse(details);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('Validation failed');
    expect(body.error.details).toEqual(details);
  });
});

describe('notFoundResponse', () => {
  it('returns 404 with NOT_FOUND code and default message', async () => {
    const res = notFoundResponse();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Not found');
  });

  it('returns 404 with custom message', async () => {
    const res = notFoundResponse('User not found');
    const body = await res.json();
    expect(body.error.message).toBe('User not found');
  });
});

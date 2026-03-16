import { describe, expect, it } from 'vitest';

import { ApiError } from '@workspace/shared/errors';

import { getAdminErrorMessage, getRequestId, getUserMessage } from './apiError';

describe('apiError helpers', () => {
  it('returns user-facing message for ApiError codes', () => {
    expect(getUserMessage(new ApiError('UNAUTHORIZED', 'raw message'))).toBe('로그인이 필요합니다');
  });

  it('returns requestId from ApiError', () => {
    const error = new ApiError('INTERNAL_SERVER_ERROR', 'boom', undefined, 500, 'req_123');

    expect(getRequestId(error)).toBe('req_123');
  });

  it('appends requestId to admin error message', () => {
    const error = new ApiError('BAD_REQUEST', 'raw message', undefined, 400, 'req_admin_123');

    expect(getAdminErrorMessage(error)).toBe('잘못된 요청입니다 (요청 ID: req_admin_123)');
  });

  it('falls back to base message when requestId is absent', () => {
    const error = new ApiError('NOT_FOUND', 'raw message');

    expect(getAdminErrorMessage(error)).toBe('요청한 항목을 찾을 수 없습니다');
  });
});

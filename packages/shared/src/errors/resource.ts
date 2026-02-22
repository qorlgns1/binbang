import { AppError } from './base';

/** 404 — requested resource does not exist. */
export class NotFoundError extends AppError {
  /** @param message - 에러 메시지 (기본: 'Not found') */
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/** 409 — operation conflicts with the current resource state. */
export class ConflictError extends AppError {
  /** @param message - 에러 메시지 (기본: 'Conflict') */
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}

/** 403 — authenticated but not authorised for this action. */
export class ForbiddenError extends AppError {
  /** @param message - 에러 메시지 (기본: 'Forbidden') */
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

/** 401 — authentication required or invalid credentials. */
export class UnauthorizedError extends AppError {
  /** @param message - 에러 메시지 (기본: 'Unauthorized') */
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

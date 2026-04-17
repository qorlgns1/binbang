import { AppError } from './base';

/** 500 — expected server-side failure mapped to an internal server error response. */
export class InternalServerError extends AppError {
  /** @param message - 에러 메시지 (기본: 'Internal server error') */
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

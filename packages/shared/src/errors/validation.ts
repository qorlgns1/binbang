import { AppError } from './base';

/** 단일 필드 검증 실패 항목 (필드명, 메시지). */
export interface ValidationDetail {
  field?: string;
  message: string;
}

/**
 * 400 — input data failed validation.
 *
 * @param message - 요약 메시지 (기본: 'Validation failed')
 * @param details - 필드별 검증 실패 목록
 */
export class ValidationError extends AppError {
  readonly details: ValidationDetail[];

  constructor(message = 'Validation failed', details: ValidationDetail[] = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

/** 400 — generic bad request. */
export class BadRequestError extends AppError {
  /** @param message - 에러 메시지 (기본: 'Bad request') */
  constructor(message = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

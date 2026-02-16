import { AppError } from './base';

export interface ValidationDetail {
  field?: string;
  message: string;
}

/** 400 — input data failed validation. */
export class ValidationError extends AppError {
  readonly details: ValidationDetail[];

  constructor(message = 'Validation failed', details: ValidationDetail[] = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.details = details;
  }
}

/** 400 — generic bad request. */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
    this.name = 'BadRequestError';
  }
}

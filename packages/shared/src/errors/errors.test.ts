import { describe, expect, it } from 'vitest';

import { AppError } from './base';
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from './resource';
import { BadRequestError, ValidationError } from './validation';

describe('AppError hierarchy', () => {
  it('AppError has correct properties', () => {
    const error = new AppError('test message', 418, 'TEAPOT');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('test message');
    expect(error.statusCode).toBe(418);
    expect(error.code).toBe('TEAPOT');
    expect(error.name).toBe('AppError');
  });

  it('NotFoundError defaults to 404', () => {
    const error = new NotFoundError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Not found');
    expect(error.name).toBe('NotFoundError');
  });

  it('NotFoundError accepts custom message', () => {
    const error = new NotFoundError('User not found');
    expect(error.message).toBe('User not found');
    expect(error.statusCode).toBe(404);
  });

  it('ConflictError defaults to 409', () => {
    const error = new ConflictError('Already exists');
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('CONFLICT');
  });

  it('ForbiddenError defaults to 403', () => {
    const error = new ForbiddenError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  it('UnauthorizedError defaults to 401', () => {
    const error = new UnauthorizedError();
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
  });

  it('BadRequestError defaults to 400', () => {
    const error = new BadRequestError('invalid input');
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
  });

  it('ValidationError carries details', () => {
    const details = [{ field: 'email', message: 'Invalid email' }, { message: 'Missing required field' }];
    const error = new ValidationError('Validation failed', details);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details).toEqual(details);
  });

  it('ValidationError defaults to empty details', () => {
    const error = new ValidationError();
    expect(error.details).toEqual([]);
    expect(error.message).toBe('Validation failed');
  });

  it('all errors are catchable as Error', () => {
    const errors = [
      new NotFoundError(),
      new ConflictError(),
      new ForbiddenError(),
      new UnauthorizedError(),
      new BadRequestError(),
      new ValidationError(),
    ];

    for (const error of errors) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    }
  });
});

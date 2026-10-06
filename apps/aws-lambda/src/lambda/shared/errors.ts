export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(401, message, code);
    this.name = 'UnauthorizedError';
  }
}

export class ValidationApiError extends ApiError {
  constructor(
    message: string,
    public readonly details?: unknown,
    code = 'VALIDATION_ERROR'
  ) {
    super(400, message, code);
    this.name = 'ValidationApiError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, code = 'NOT_FOUND') {
    super(404, `${resource} not found`, code);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, code = 'CONFLICT') {
    super(409, message, code);
    this.name = 'ConflictError';
  }
}

export class InternalServerApiError extends ApiError {
  constructor(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    super(500, message, code);
    this.name = 'InternalServerApiError';
  }
}

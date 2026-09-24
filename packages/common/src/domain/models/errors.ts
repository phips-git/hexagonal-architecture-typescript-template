type DomainErrorOptions = ErrorOptions & {
  context?: Record<string, unknown>;
};

export class DomainError extends Error {
  readonly logLevel: LogLevel = 'info';
  readonly context?: Record<string, unknown>;

  constructor(message: string, options?: DomainErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    if (options?.context) {
      this.context = options.context;
    }
  }
}

export const isDomainError = (error: unknown): error is DomainError => {
  return error instanceof DomainError;
};

export class UnauthorizedError extends DomainError {
  constructor(message = 'Unauthorized', options?: DomainErrorOptions) {
    super(message, options);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Forbidden', options?: DomainErrorOptions) {
    super(message, options);
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'Not found', options?: DomainErrorOptions) {
    super(message, options);
  }
}

export class ValidationError extends DomainError {
  constructor(message = 'Validation failed', options?: DomainErrorOptions) {
    super(message, options);
  }
}

export class ConflictError extends DomainError {
  constructor(message = 'Conflict', options?: DomainErrorOptions) {
    super(message, options);
  }
}

export class InternalServerError extends DomainError {
  override readonly logLevel = 'error' as const;

  constructor(message = 'Internal server error', options?: DomainErrorOptions) {
    super(message, options);
  }
}

export class InvariantError extends DomainError {
  override readonly logLevel = 'error' as const;

  constructor(message = 'Invariant failed', options?: DomainErrorOptions) {
    super(message, options);
  }
}

export class ExternalServiceError extends DomainError {
  override readonly logLevel = 'error' as const;

  constructor(
    message = 'External service error',
    options?: DomainErrorOptions
  ) {
    super(message, options);
  }
}

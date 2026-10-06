import { isDomainError } from '@hexagonal-ts-template/common/domain';

export interface LambdaErrorResponse {
  statusCode: number;
  headers: { 'Content-Type': string };
  body: string;
}

export function buildLambdaErrorResponse(
  error: unknown,
  requestId: string
): LambdaErrorResponse {
  if (error instanceof Error && error.name === 'UnauthorizedError') {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        code: 'UNAUTHORIZED',
        requestId
      })
    };
  }

  if (error instanceof Error && error.name === 'ValidationApiError') {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        code: 'VALIDATION_ERROR',
        requestId
      })
    };
  }

  if (isDomainError(error)) {
    const statusCode = getStatusCodeForDomainError(error);
    return {
      statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        code: error.name,
        requestId
      })
    };
  }

  return {
    statusCode: 500,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      code: 'INTERNAL_ERROR',
      requestId
    })
  };
}

function getStatusCodeForDomainError(error: Error): number {
  switch (error.constructor.name) {
    case 'UnauthorizedError':
      return 401;
    case 'ForbiddenError':
      return 403;
    case 'NotFoundError':
      return 404;
    case 'ValidationError':
      return 400;
    case 'ConflictError':
      return 409;
    case 'InternalServerError':
    case 'InvariantError':
      return 500;
    case 'ExternalServiceError':
      return 502;
    default:
      return 500;
  }
}

import { isDomainError } from '@hexagonal-ts-template/common/domain';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Response } from 'express';

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'object'
          ? exceptionResponse['message'] || exceptionResponse
          : exceptionResponse;
    } else if (isDomainError(exception)) {
      status = this.getStatusForDomainError(exception);
      message = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url
    } satisfies ErrorResponse);
  }

  private getStatusForDomainError(exception: Error): number {
    switch (exception.constructor.name) {
      case 'UnauthorizedError':
        return HttpStatus.UNAUTHORIZED;
      case 'ForbiddenError':
        return HttpStatus.FORBIDDEN;
      case 'NotFoundError':
        return HttpStatus.NOT_FOUND;
      case 'ValidationError':
        return HttpStatus.BAD_REQUEST;
      case 'ConflictError':
        return HttpStatus.CONFLICT;
      case 'InternalServerError':
      case 'InvariantError':
        return HttpStatus.INTERNAL_SERVER_ERROR;
      case 'ExternalServiceError':
        return HttpStatus.BAD_GATEWAY;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}

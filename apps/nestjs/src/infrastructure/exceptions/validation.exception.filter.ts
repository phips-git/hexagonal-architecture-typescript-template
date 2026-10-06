import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter
} from '@nestjs/common';
import { HttpStatus, Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const exceptionResponse = exception.getResponse() as {
      message: string[];
      error: string;
    };
    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: Array.isArray(exceptionResponse.message)
        ? exceptionResponse.message
        : [exceptionResponse.message],
      timestamp: new Date().toISOString(),
      path: request.url
    });
  }
}

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = req;
    const startTime = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const logLevel =
        statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
      console[logLevel](
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: logLevel.toUpperCase(),
          method,
          url: originalUrl,
          ip,
          statusCode,
          durationMs: duration
        })
      );
    });
    next();
  }
}

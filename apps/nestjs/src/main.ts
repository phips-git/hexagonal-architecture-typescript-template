import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './infrastructure/exceptions/all-exceptions.filter';
import { ValidationExceptionFilter } from './infrastructure/exceptions/validation.exception.filter';
import { ResponseInterceptor } from './infrastructure/interceptors/response.interceptor';
import { LoggingMiddleware } from './infrastructure/middleware/logging.middleware';

const swaggerDocumentOptions = new DocumentBuilder()
  .setTitle('Task Management API')
  .setDescription('API for managing projects and tasks')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(new LoggingMiddleware().use.bind(new LoggingMiddleware()));
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new ValidationExceptionFilter()
  );
  const swaggerDocument = SwaggerModule.createDocument(
    app,
    swaggerDocumentOptions
  );
  SwaggerModule.setup('api', app, swaggerDocument);
  const port = app.get(ConfigService).get<number>('app.port') ?? 3000;
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

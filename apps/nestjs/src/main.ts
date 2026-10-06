import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './infrastructure/exceptions/all-exceptions.filter';
import { ValidationExceptionFilter } from './infrastructure/exceptions/validation.exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new ValidationExceptionFilter()
  );
  const port = app.get(ConfigService).get<number>('app.port') ?? 3000;
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

import { isDomainError } from '../domain/models';
import type { IdGeneratorPort } from './ports/id-generator.port';
import type { LogContext, LoggerPort } from './ports/logger.port';

export interface UsecaseExecutionDependencies {
  generateId: IdGeneratorPort;
  loggerFactory: (loggerName: string) => LoggerPort;
}

export abstract class Usecase<TInput = void, TOutput = void> {
  constructor(protected readonly dependencies: UsecaseExecutionDependencies) {}

  protected abstract executeInternal(
    input: TInput,
    logger: LoggerPort
  ): Promise<TOutput>;

  async execute(
    input: Readonly<TInput>,
    executionContext?: Readonly<Record<string, unknown>>
  ): Promise<TOutput> {
    const startTime = Date.now();
    const executionId = this.dependencies.generateId();
    const logger = this.dependencies.loggerFactory(this.constructor.name);

    try {
      const result = await this.executeInternal(input, logger);

      logger.info('Execution completed', {
        executionId,
        durationMs: Date.now() - startTime,
        ...executionContext
      });

      return result;
    } catch (error) {
      const isDomainErrorInstance = isDomainError(error);
      const logLevel = isDomainErrorInstance ? error.logLevel : 'error';
      const message = isDomainErrorInstance
        ? 'Execution failed'
        : 'Unexpected error';

      const logContext: LogContext = {
        executionId,
        durationMs: Date.now() - startTime,
        ...(isDomainErrorInstance &&
          error.context && { errorContext: error.context }),
        ...(executionContext && { executionContext }),
        error
      };

      switch (logLevel) {
        case 'warn':
          logger.warn(message, logContext);
          break;
        case 'error':
          logger.error(message, logContext);
          break;
        default:
          logger.info(message, logContext);
          break;
      }

      throw error;
    }
  }
}

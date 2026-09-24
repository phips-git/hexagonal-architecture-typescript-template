import { isDomainError } from '../domain/models';
import type { LoggerPort, UsecaseExecutionDependencies } from './ports';

export abstract class Usecase<TInput = void, TOutput = void> {
  private static executionDependencies: UsecaseExecutionDependencies | null =
    null;

  static configureExecutionDependencies(
    executionDependencies: UsecaseExecutionDependencies
  ): void {
    Usecase.executionDependencies = executionDependencies;
  }

  static resetExecutionDependencies(): void {
    Usecase.executionDependencies = null;
  }

  static getExecutionDependencies(): UsecaseExecutionDependencies {
    if (!Usecase.executionDependencies) {
      throw new Error(
        'Usecase execution dependencies have not been configured. Call Usecase.configureExecutionDependencies() during app bootstrap.'
      );
    }

    return Usecase.executionDependencies;
  }

  protected abstract executeInternal(
    input: TInput,
    logger: LoggerPort
  ): Promise<TOutput>;

  async execute(
    input: TInput,
    executionContext?: Record<string, unknown>
  ): Promise<TOutput> {
    const executionDependencies = Usecase.getExecutionDependencies();
    const startTime = Date.now();
    const executionId = executionDependencies.idGenerator.generate();
    const executionLogger = executionDependencies.loggerFactory(
      this.constructor.name
    );

    try {
      const result = await this.executeInternal(input, executionLogger);
      executionLogger.info('Execution completed', {
        executionContext: { ...executionContext, executionId },
        duration: `${(Date.now() - startTime).toFixed(2)}ms`
      });

      return result;
    } catch (error) {
      const isDomainErrorInstance = isDomainError(error);
      const logLevelByError = isDomainErrorInstance ? error.logLevel : 'error';
      const message = isDomainErrorInstance
        ? 'Failed'
        : 'Failed with unexpected error';
      const context = {
        executionContext: { ...executionContext, executionId },
        duration: `${(Date.now() - startTime).toFixed(2)}ms`,
        error
      };

      switch (logLevelByError) {
        case 'warn':
          executionLogger.warn(message, context);
          break;
        case 'error':
          executionLogger.error(message, context);
          break;
        default:
          executionLogger.info(message, context);
          break;
      }

      executionDependencies.markErrorAsLogged(error);
      throw error;
    }
  }
}

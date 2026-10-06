import {
  Usecase,
  type LoggerPort,
  type UsecaseExecutionDependencies
} from '@hexagonal-ts-template/common/application';
import type { User } from '../../domain/models';
import type {
  AuthenticationPort,
  UserPersistencePort
} from '../../domain/ports';

export interface GetAuthenticatedUserInput {
  readonly headers: Record<string, string>;
}

export type GetAuthenticatedUserOutput = User | null;

export class GetAuthenticatedUserUsecase extends Usecase<
  GetAuthenticatedUserInput,
  GetAuthenticatedUserOutput
> {
  constructor(
    dependencies: UsecaseExecutionDependencies,
    private readonly authenticationPort: AuthenticationPort,
    private readonly userPersistence: UserPersistencePort
  ) {
    super(dependencies);
  }

  protected async executeInternal(
    { headers }: GetAuthenticatedUserInput,
    logger: LoggerPort
  ): Promise<GetAuthenticatedUserOutput> {
    const user = await this.authenticationPort.authenticateRequest(headers);

    if (!user) {
      return null;
    }

    const authenticatedUser = await this.userPersistence.findById(user.id);

    if (!authenticatedUser) {
      logger.warn('User not found in database', { userId: user.id });
      return null;
    }

    return authenticatedUser;
  }
}

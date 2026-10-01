import {
  Usecase,
  type LoggerPort,
  type UsecaseExecutionDependencies
} from '@hexagonal-ts-template/common/application';
import { NotFoundError } from '@hexagonal-ts-template/common/domain';
import type {
  ProjectId,
  TaskManagementAuthorizationContext
} from '../../domain/models';
import {
  ensureCanDeleteProject,
  ensureProjectReferenceExists
} from '../../domain/policies';
import type { ProjectPersistencePort } from '../../domain/ports';

export interface DeleteProjectInput {
  readonly authorizationContext: TaskManagementAuthorizationContext;
  readonly projectId: ProjectId;
}

export interface DeleteProjectOutput {
  readonly projectId: ProjectId;
}

export class DeleteProjectUsecase extends Usecase<
  DeleteProjectInput,
  DeleteProjectOutput
> {
  constructor(
    dependencies: UsecaseExecutionDependencies,
    private readonly projectPersistence: ProjectPersistencePort
  ) {
    super(dependencies);
  }

  protected async executeInternal(
    { authorizationContext, projectId }: DeleteProjectInput,
    logger: LoggerPort
  ): Promise<DeleteProjectOutput> {
    ensureCanDeleteProject(authorizationContext);

    const projectReference =
      await this.projectPersistence.findReference(projectId);
    ensureProjectReferenceExists(projectReference, { projectId });

    const deleted = await this.projectPersistence.remove(projectId);
    if (!deleted) {
      throw new NotFoundError(`Project with id ${projectId} not found`);
    }

    logger.info('Project deleted', { projectId });

    return { projectId };
  }
}

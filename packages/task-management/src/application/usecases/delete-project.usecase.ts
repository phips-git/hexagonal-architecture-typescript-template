import {
  Usecase,
  type LoggerPort,
  type UsecaseExecutionDependencies
} from '@hexagonal-ts-template/common/application';
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

export class DeleteProjectUsecase extends Usecase<DeleteProjectInput, void> {
  constructor(
    dependencies: UsecaseExecutionDependencies,
    private readonly projectPersistence: ProjectPersistencePort
  ) {
    super(dependencies);
  }

  protected async executeInternal(
    { authorizationContext, projectId }: DeleteProjectInput,
    logger: LoggerPort
  ): Promise<void> {
    ensureCanDeleteProject(authorizationContext);

    ensureProjectReferenceExists(
      await this.projectPersistence.findReference(projectId),
      { projectId }
    );

    await this.projectPersistence.remove(projectId);

    logger.info('Project deleted', { projectId });
  }
}

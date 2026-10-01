import {
  Usecase,
  type LoggerPort,
  type UsecaseExecutionDependencies
} from '@hexagonal-ts-template/common/application';
import type {
  ProjectId,
  ProjectUpdateProperties,
  TaskManagementAuthorizationContext
} from '../../domain.export';
import {
  ensureCanUpdateProject,
  ensureProjectReferenceExists
} from '../../domain/policies';
import { type ProjectPersistencePort } from '../../domain/ports';
import { validateProjectUpdateProperties } from '../../domain/validators';
import { assembleProjectUpdateRecord } from '../assemblers/project-assembler';

export interface UpdateProjectInput {
  readonly authorizationContext: TaskManagementAuthorizationContext;
  readonly projectId: ProjectId;
  readonly updateProperties: ProjectUpdateProperties;
}

export interface UpdateProjectOutput {
  readonly projectId: ProjectId;
}

export class UpdateProjectUsecase extends Usecase<
  UpdateProjectInput,
  UpdateProjectOutput
> {
  constructor(
    dependencies: UsecaseExecutionDependencies,
    private readonly projectPersistence: ProjectPersistencePort
  ) {
    super(dependencies);
  }

  protected async executeInternal(
    { authorizationContext, projectId, updateProperties }: UpdateProjectInput,
    logger: LoggerPort
  ): Promise<UpdateProjectOutput> {
    ensureCanUpdateProject(authorizationContext);

    ensureProjectReferenceExists(
      await this.projectPersistence.findReference(projectId),
      { projectId }
    );

    validateProjectUpdateProperties(updateProperties);

    const updateRecord = assembleProjectUpdateRecord(updateProperties);

    await this.projectPersistence.update(projectId, updateRecord);

    logger.info('Project updated', { projectId });

    return { projectId };
  }
}

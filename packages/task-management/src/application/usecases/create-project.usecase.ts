import {
  Usecase,
  type LoggerPort,
  type UsecaseExecutionDependencies
} from '@hexagonal-ts-template/common/application';
import type {
  ProjectCreationProperties,
  ProjectId,
  TaskManagementAuthorizationContext
} from '../../domain/models';
import { ensureCanCreateProject } from '../../domain/policies';
import type { ProjectPersistencePort } from '../../domain/ports';
import { validateProjectCreationProperties } from '../../domain/validators';
import { assembleProjectCreationRecord } from '../assemblers';

export interface CreateProjectInput {
  readonly authorizationContext: TaskManagementAuthorizationContext;
  readonly creationProperties: ProjectCreationProperties;
}

export interface CreateProjectOutput {
  readonly projectId: ProjectId;
}

export class CreateProjectUsecase extends Usecase<
  CreateProjectInput,
  CreateProjectOutput
> {
  constructor(
    dependencies: UsecaseExecutionDependencies,
    private readonly projectPersistence: ProjectPersistencePort
  ) {
    super(dependencies);
  }

  protected async executeInternal(
    { authorizationContext, creationProperties }: CreateProjectInput,
    logger: LoggerPort
  ): Promise<CreateProjectOutput> {
    ensureCanCreateProject(authorizationContext);

    validateProjectCreationProperties(creationProperties);

    const creationRecord = assembleProjectCreationRecord(
      this.dependencies.generateId(),
      creationProperties
    );

    const { id: projectId } =
      await this.projectPersistence.create(creationRecord);

    logger.info('Project created', { projectId });

    return { projectId };
  }
}

import {
  Usecase,
  type LoggerPort,
  type UnitOfWorkPort,
  type UsecaseExecutionDependencies
} from '@hexagonal-ts-template/common/application';
import type {
  ProjectId,
  TaskCreationProperties,
  TaskId,
  TaskManagementAuthorizationContext
} from '../../domain/models';
import {
  ensureCanCreateTask,
  ensureProjectReferenceExists
} from '../../domain/policies';
import type {
  ProjectPersistencePort,
  ProjectStatsPersistencePort,
  TaskPersistencePort
} from '../../domain/ports';
import {
  validateProjectId,
  validateTaskCreationProperties
} from '../../domain/validators';
import { assembleTaskCreationRecord } from '../assemblers';

export interface CreateTaskInput {
  readonly authorizationContext: TaskManagementAuthorizationContext;
  readonly projectId: ProjectId;
  readonly creationProperties: TaskCreationProperties;
}

export interface CreateTaskOutput {
  readonly taskId: TaskId;
}

export class CreateTaskUsecase extends Usecase<
  CreateTaskInput,
  CreateTaskOutput
> {
  constructor(
    dependencies: UsecaseExecutionDependencies,
    private readonly projectPersistence: ProjectPersistencePort,
    private readonly unitOfWork: UnitOfWorkPort,
    private readonly taskPersistence: TaskPersistencePort,
    private readonly projectStatsPersistence: ProjectStatsPersistencePort
  ) {
    super(dependencies);
  }

  protected async executeInternal(
    { authorizationContext, projectId, creationProperties }: CreateTaskInput,
    logger: LoggerPort
  ): Promise<CreateTaskOutput> {
    ensureCanCreateTask(authorizationContext);

    validateProjectId(projectId);
    validateTaskCreationProperties(creationProperties);

    ensureProjectReferenceExists(
      await this.projectPersistence.findReference(projectId),
      { projectId }
    );

    const creationRecord = assembleTaskCreationRecord(
      this.dependencies.generateId(),
      projectId,
      creationProperties
    );

    const taskId = await this.unitOfWork.withTransaction(async () => {
      const { id: taskId } = await this.taskPersistence.create(creationRecord);

      await this.projectStatsPersistence.incrementTaskCount(
        projectId,
        new Date()
      );

      return taskId;
    });

    logger.info('Task created', { projectId, taskId });

    return { taskId };
  }
}

import {
  Usecase,
  type LoggerPort,
  type UnitOfWorkPort,
  type UsecaseExecutionDependencies
} from '@hexagonal-ts-template/common/application';
import { NotFoundError } from '@hexagonal-ts-template/common/domain';
import type {
  ProjectId,
  TaskCreationProperties,
  TaskId,
  TaskManagementAuthorizationContext
} from '../../domain/models';
import { ensureCanCreateTask } from '../../domain/policies';
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
    private readonly taskPersistence: TaskPersistencePort,
    private readonly projectPersistence: ProjectPersistencePort,
    private readonly projectStatsPersistence: ProjectStatsPersistencePort,
    private readonly unitOfWork: UnitOfWorkPort
  ) {
    super(dependencies);
  }

  protected async executeInternal(
    { authorizationContext, projectId, creationProperties }: CreateTaskInput,
    logger: LoggerPort
  ): Promise<CreateTaskOutput> {
    ensureCanCreateTask(authorizationContext);

    const validatedProjectId = validateProjectId(projectId);

    const projectReference =
      await this.projectPersistence.findReference(validatedProjectId);
    if (!projectReference) {
      throw new NotFoundError(`Project with id ${projectId} not found`);
    }

    validateTaskCreationProperties(creationProperties);

    const creationRecord = assembleTaskCreationRecord(
      this.dependencies.generateId(),
      creationProperties
    );

    const taskId = await this.unitOfWork.withTransaction(async () => {
      const { id } = await this.taskPersistence.create(creationRecord);

      await this.projectStatsPersistence.incrementTaskCount(
        validatedProjectId,
        new Date()
      );

      return id;
    });

    logger.info('Task created', { taskId, projectId });

    return { taskId };
  }
}

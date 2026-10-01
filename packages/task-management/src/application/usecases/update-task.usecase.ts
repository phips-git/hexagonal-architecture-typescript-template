import {
  Usecase,
  type LoggerPort,
  type UsecaseExecutionDependencies
} from '@hexagonal-ts-template/common/application';
import { NotFoundError } from '@hexagonal-ts-template/common/domain';
import type {
  ProjectId,
  TaskId,
  TaskManagementAuthorizationContext,
  TaskUpdateProperties
} from '../../domain/models';
import {
  ensureCanUpdateTask,
  ensureTaskReferenceExists
} from '../../domain/policies';
import type { TaskPersistencePort } from '../../domain/ports';
import { validateTaskUpdateProperties } from '../../domain/validators';
import { assembleTaskUpdateRecord } from '../assemblers';

export interface UpdateTaskInput {
  readonly authorizationContext: TaskManagementAuthorizationContext;
  readonly projectId: ProjectId;
  readonly taskId: TaskId;
  readonly updateProperties: TaskUpdateProperties;
}

export interface UpdateTaskOutput {
  readonly taskId: TaskId;
}

export class UpdateTaskUsecase extends Usecase<
  UpdateTaskInput,
  UpdateTaskOutput
> {
  constructor(
    dependencies: UsecaseExecutionDependencies,
    private readonly taskPersistence: TaskPersistencePort
  ) {
    super(dependencies);
  }

  protected async executeInternal(
    {
      authorizationContext,
      projectId,
      taskId,
      updateProperties
    }: UpdateTaskInput,
    logger: LoggerPort
  ): Promise<UpdateTaskOutput> {
    ensureCanUpdateTask(authorizationContext);

    ensureTaskReferenceExists(
      await this.taskPersistence.findReference(taskId, projectId),
      { taskId, authorizationContext }
    );

    const currentTask = await this.taskPersistence.findById(taskId, projectId);
    if (!currentTask) {
      throw new NotFoundError(`Task with id ${taskId} not found`);
    }

    validateTaskUpdateProperties(updateProperties, currentTask.status);

    const updateRecord = assembleTaskUpdateRecord(updateProperties);

    await this.taskPersistence.update(taskId, projectId, updateRecord);

    logger.info('Task updated', { taskId, projectId });

    return { taskId };
  }
}

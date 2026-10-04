import {
  Usecase,
  type LoggerPort,
  type UsecaseExecutionDependencies
} from '@hexagonal-ts-template/common/application';
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
import {
  validateProjectId,
  validateTaskId,
  validateTaskUpdateProperties
} from '../../domain/validators';
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

    validateProjectId(projectId);
    validateTaskId(taskId);

    const taskReference = await this.taskPersistence.findReference(
      projectId,
      taskId
    );
    ensureTaskReferenceExists(taskReference, { projectId, taskId });

    validateTaskUpdateProperties(updateProperties, taskReference.status);

    const updateRecord = assembleTaskUpdateRecord(updateProperties);

    await this.taskPersistence.update(projectId, taskId, updateRecord);

    logger.info('Task updated', { taskId, projectId });

    return { taskId };
  }
}

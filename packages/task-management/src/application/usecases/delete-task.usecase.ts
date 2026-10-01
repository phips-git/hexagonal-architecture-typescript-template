import {
  Usecase,
  type LoggerPort,
  type UnitOfWorkPort,
  type UsecaseExecutionDependencies
} from '@hexagonal-ts-template/common/application';
import { NotFoundError } from '@hexagonal-ts-template/common/domain';
import type {
  ProjectId,
  TaskId,
  TaskManagementAuthorizationContext
} from '../../domain/models';
import {
  ensureCanDeleteTask,
  ensureTaskReferenceExists
} from '../../domain/policies';
import type {
  ProjectStatsPersistencePort,
  TaskPersistencePort
} from '../../domain/ports';

export interface DeleteTaskInput {
  readonly authorizationContext: TaskManagementAuthorizationContext;
  readonly projectId: ProjectId;
  readonly taskId: TaskId;
}

export interface DeleteTaskOutput {
  taskId: TaskId;
}

export class DeleteTaskUsecase extends Usecase<
  DeleteTaskInput,
  DeleteTaskOutput
> {
  constructor(
    dependencies: UsecaseExecutionDependencies,
    private readonly taskPersistence: TaskPersistencePort,
    private readonly projectStatsPersistence: ProjectStatsPersistencePort,
    private readonly unitOfWork: UnitOfWorkPort
  ) {
    super(dependencies);
  }

  protected async executeInternal(
    { authorizationContext, projectId, taskId }: DeleteTaskInput,
    logger: LoggerPort
  ): Promise<DeleteTaskOutput> {
    ensureCanDeleteTask(authorizationContext);

    const taskReference = await this.taskPersistence.findReference(
      taskId,
      projectId
    );
    ensureTaskReferenceExists(taskReference, {
      taskId,
      projectId,
      authorizationContext
    });

    await this.unitOfWork.withTransaction(async () => {
      const deleted = await this.taskPersistence.remove(taskId, projectId);
      if (!deleted) {
        throw new NotFoundError(`Task with id ${taskId} not found`);
      }

      await this.projectStatsPersistence.decrementTaskCount(
        projectId,
        new Date()
      );
    });

    logger.info('Task deleted', { taskId, projectId });

    return { taskId };
  }
}

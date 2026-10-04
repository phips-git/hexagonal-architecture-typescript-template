import {
  Usecase,
  type LoggerPort,
  type UnitOfWorkPort,
  type UsecaseExecutionDependencies
} from '@hexagonal-ts-template/common/application';
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
import { validateProjectId, validateTaskId } from '../../domain/validators';

export interface DeleteTaskInput {
  readonly authorizationContext: TaskManagementAuthorizationContext;
  readonly projectId: ProjectId;
  readonly taskId: TaskId;
}

export class DeleteTaskUsecase extends Usecase<DeleteTaskInput, void> {
  constructor(
    dependencies: UsecaseExecutionDependencies,
    private readonly taskPersistence: TaskPersistencePort,
    private readonly unitOfWork: UnitOfWorkPort,
    private readonly projectStatsPersistence: ProjectStatsPersistencePort
  ) {
    super(dependencies);
  }

  protected async executeInternal(
    { authorizationContext, projectId, taskId }: DeleteTaskInput,
    logger: LoggerPort
  ): Promise<void> {
    ensureCanDeleteTask(authorizationContext);

    validateProjectId(projectId);
    validateTaskId(taskId);

    ensureTaskReferenceExists(
      await this.taskPersistence.findReference(projectId, taskId),
      {
        projectId,
        taskId
      }
    );

    await this.unitOfWork.withTransaction(async () => {
      await this.taskPersistence.remove(projectId, taskId);

      await this.projectStatsPersistence.decrementTaskCount(
        projectId,
        new Date()
      );
    });

    logger.info('Task deleted', { taskId, projectId });
  }
}

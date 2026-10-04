import {
  Usecase,
  type LoggerPort,
  type UsecaseExecutionDependencies
} from '@hexagonal-ts-template/common/application';
import type {
  ProjectId,
  TaskListItem,
  TaskManagementAuthorizationContext
} from '../../domain/models';
import type { TaskPersistencePort } from '../../domain/ports';

export interface ListTasksInput {
  readonly authorizationContext: TaskManagementAuthorizationContext;
  readonly projectId: ProjectId;
}

export type ListTasksOutput = ReadonlyArray<TaskListItem>;

export class ListTasksUsecase extends Usecase<ListTasksInput, ListTasksOutput> {
  constructor(
    dependencies: UsecaseExecutionDependencies,
    private readonly taskPersistence: TaskPersistencePort
  ) {
    super(dependencies);
  }

  protected async executeInternal(
    { projectId }: ListTasksInput,
    logger: LoggerPort
  ): Promise<ListTasksOutput> {
    const tasks = await this.taskPersistence.findAllByProject(projectId);

    logger.info('Tasks listed', { projectId, taskCount: tasks.length });

    return tasks;
  }
}

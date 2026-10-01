import type {
  Task,
  TaskCreationProperties,
  TaskListItem,
  TaskReference,
  TaskUpdateProperties
} from '../models';

export interface TaskPersistencePort {
  create(creationProperties: TaskCreationProperties): Promise<Task>;

  findReference(
    taskId: string,
    projectId: string
  ): Promise<TaskReference | null>;

  findById(taskId: string, projectId: string): Promise<Task | null>;

  findAllByProject(projectId: string): Promise<TaskListItem[]>;

  update(
    taskId: string,
    projectId: string,
    updateProperties: TaskUpdateProperties
  ): Promise<Task>;

  remove(taskId: string, projectId: string): Promise<boolean>;
}

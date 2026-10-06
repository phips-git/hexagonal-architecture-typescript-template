import type {
  ProjectId,
  Task,
  TaskCreationRecord,
  TaskId,
  TaskListItem,
  TaskReference,
  TaskUpdateRecord
} from '../models';

export interface TaskPersistencePort {
  create(creationRecord: TaskCreationRecord): Promise<void>;

  findReference(
    projectId: ProjectId,
    taskId: TaskId
  ): Promise<TaskReference | null>;

  findById(projectId: ProjectId, taskId: TaskId): Promise<Task | null>;

  findAllByProject(projectId: ProjectId): Promise<TaskListItem[]>;

  update(
    projectId: ProjectId,
    taskId: TaskId,
    updateRecord: TaskUpdateRecord
  ): Promise<void>;

  remove(projectId: ProjectId, taskId: TaskId): Promise<void>;
}

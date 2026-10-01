import type { Brand } from '@hexagonal-ts-template/common/domain';
import type { ProjectId } from './project';
import type { TaskPriority } from './task-priority.enum';
import type { TaskStatus } from './task-status.enum';

export type TaskId = Brand<string, 'TaskId'>;

export interface TaskReference {
  readonly id: TaskId;
  readonly title: string;
}

export interface Task extends TaskReference {
  readonly projectId: ProjectId;
  readonly description: string | null;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly assignedTo: string | null;
  readonly dueDate: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface TaskListItem extends TaskReference {
  readonly projectId: ProjectId;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly createdAt: Date;
}

export type TaskCreationProperties = Pick<
  Task,
  'title' | 'description' | 'priority' | 'assignedTo' | 'dueDate'
>;

export interface TaskCreationRecord
  extends TaskReference, TaskCreationProperties {
  readonly status: TaskStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type TaskUpdateProperties = Partial<
  Pick<
    Task,
    'title' | 'description' | 'status' | 'priority' | 'assignedTo' | 'dueDate'
  > & { completionNotes?: string | undefined }
>;

export interface TaskUpdateRecord extends TaskUpdateProperties {
  readonly updatedAt: string;
}

import type { Brand } from '@hexagonal-ts-template/common/domain';
import type { ProjectId } from './project';
import type { TaskPriority } from './task-priority.enum';
import type { TaskStatus } from './task-status.enum';

export type TaskId = Brand<string, 'TaskId'>;

export interface TaskReference {
  readonly id: TaskId;
  readonly projectId: ProjectId;
  readonly status: TaskStatus;
}

export interface Task extends TaskReference {
  readonly title: string;
  readonly description: string | null;
  readonly priority: TaskPriority;
  readonly assignedTo: string | null;
  readonly dueDate: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface TaskListItem extends TaskReference {
  readonly priority: TaskPriority;
  readonly createdAt: Date;
}

export type TaskCreationProperties = Pick<
  Task,
  'title' | 'description' | 'priority' | 'assignedTo' | 'dueDate'
>;

export type ValidTaskCreationProperties = Brand<
  TaskCreationProperties,
  'ValidTaskCreationProperties'
>;

export interface TaskCreationRecord
  extends
    TaskReference,
    Pick<Task, 'projectId' | 'status'>,
    TaskCreationProperties {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type TaskUpdateProperties = Partial<
  Pick<
    Task,
    'title' | 'description' | 'status' | 'priority' | 'assignedTo' | 'dueDate'
  >
>;

export type ValidTaskUpdateProperties = Brand<
  TaskUpdateProperties,
  'ValidTaskUpdateProperties'
>;

export interface TaskUpdateRecord extends TaskUpdateProperties {
  readonly updatedAt: string;
}

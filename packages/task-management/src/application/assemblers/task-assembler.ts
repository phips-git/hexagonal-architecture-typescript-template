import {
  TaskStatus,
  type ProjectId,
  type TaskCreationProperties,
  type TaskCreationRecord,
  type TaskId,
  type TaskUpdateProperties,
  type TaskUpdateRecord
} from '../../domain/models';

export function assembleTaskCreationRecord(
  id: TaskId,
  projectId: ProjectId,
  creationProperties: Readonly<TaskCreationProperties>
): Readonly<TaskCreationRecord> {
  const now = new Date();

  return {
    id,
    projectId,
    ...creationProperties,
    status: TaskStatus.PENDING,
    createdAt: now,
    updatedAt: now
  };
}

export function assembleTaskUpdateRecord(
  updateProperties: Readonly<TaskUpdateProperties>
): Readonly<TaskUpdateRecord> {
  const now = new Date().toISOString();

  return {
    ...updateProperties,
    updatedAt: now
  };
}

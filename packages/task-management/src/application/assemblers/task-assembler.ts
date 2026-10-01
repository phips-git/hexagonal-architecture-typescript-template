import {
  TaskStatus,
  type TaskCreationProperties,
  type TaskCreationRecord,
  type TaskId,
  type TaskUpdateProperties,
  type TaskUpdateRecord
} from '../../domain/models';

export function assembleTaskCreationRecord(
  id: TaskId,
  creationProperties: Readonly<TaskCreationProperties>
): Readonly<TaskCreationRecord> {
  const now = new Date();

  return {
    ...creationProperties,
    id,
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

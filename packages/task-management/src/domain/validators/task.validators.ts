import { ValidationError } from '@hexagonal-ts-template/common/domain';
import {
  TaskPriority,
  TaskStatus,
  type TaskCreationProperties,
  type TaskId,
  type TaskUpdateProperties
} from '../models';

export function validateTaskCreationProperties({
  title,
  description,
  priority,
  assignedTo
}: Readonly<TaskCreationProperties>): void {
  validateTaskTitle(title);

  if (description) {
    validateTaskDescription(description);
  }

  validateTaskPriority(priority);

  if (assignedTo) {
    validateTaskAssignedTo(assignedTo);
  }
}

export function validateTaskUpdateProperties(
  {
    title,
    description,
    status,
    priority,
    assignedTo,
    completionNotes
  }: Readonly<TaskUpdateProperties>,
  currentStatus?: TaskStatus
): void {
  if (title) {
    validateTaskTitle(title);
  }

  if (description) {
    validateTaskDescription(description);
  }

  if (status) {
    validateTaskStatus(status, currentStatus);
  }

  if (priority) {
    validateTaskPriority(priority);
  }

  if (assignedTo) {
    validateTaskAssignedTo(assignedTo);
  }

  if (completionNotes) {
    validateCompletionNotes(completionNotes);
  }
}

function validateTaskStatus(
  status: TaskStatus,
  currentStatus?: TaskStatus
): TaskStatus {
  const validStatuses = Object.values(TaskStatus);
  if (!validStatuses.includes(status)) {
    throw new ValidationError('Invalid status');
  }

  if (currentStatus && status === currentStatus) {
    throw new ValidationError('Status must be different from current status');
  }

  return status;
}

function validateTaskPriority(priority: TaskPriority): TaskPriority {
  const validPriorities = Object.values(TaskPriority);
  if (!validPriorities.includes(priority)) {
    throw new ValidationError('Invalid priority');
  }

  return priority;
}

function validateTaskAssignedTo(assignedTo: string): string {
  if (assignedTo.length > 100) {
    throw new ValidationError('Assigned to must be less than 100 characters');
  }

  return assignedTo.trim();
}

export function validateTaskId(id: string): TaskId {
  const validated = id;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(validated)) {
    throw new ValidationError('Invalid TaskId format');
  }

  return validated as TaskId;
}

export function validateTaskTitle(title: string): string {
  if (!title || title.trim().length === 0) {
    throw new Error('Title is required');
  }

  if (title.length > 200) {
    throw new Error('Title must be less than 200 characters');
  }

  return title.trim();
}

export function validateTaskDescription(
  description: string | undefined
): string | undefined {
  if (description === undefined) {
    return undefined;
  }

  if (description.length > 1000) {
    throw new Error('Description must be less than 1000 characters');
  }

  return description.trim() || undefined;
}

export function validateCompletionNotes(notes: string): string {
  if (!notes || notes.trim().length === 0) {
    throw new Error('Completion notes are required when completing a task');
  }

  if (notes.length > 2000) {
    throw new Error('Completion notes must be less than 2000 characters');
  }

  return notes.trim();
}

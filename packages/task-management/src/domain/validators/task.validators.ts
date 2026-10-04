import { ValidationError } from '@hexagonal-ts-template/common/domain';
import {
  isValidTaskPriority,
  isValidTaskStatus,
  TaskPriority,
  TaskStatus,
  type TaskCreationProperties,
  type TaskId,
  type TaskUpdateProperties,
  type ValidTaskCreationProperties,
  type ValidTaskUpdateProperties
} from '../models';

export function validateTaskId(taskId: TaskId): asserts taskId is TaskId {
  if (typeof taskId !== 'string') {
    throw new ValidationError('Task id must be a string', {
      context: { taskId }
    });
  }

  if (taskId.length === 0) {
    throw new ValidationError('Task id must not be empty', {
      context: { taskId }
    });
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(taskId)) {
    throw new ValidationError('Invalid task id format', {
      context: { taskId }
    });
  }
}

export function validateTaskCreationProperties(
  creationProperties: Readonly<TaskCreationProperties>
): asserts creationProperties is ValidTaskCreationProperties {
  validateTaskTitle(creationProperties.title);

  validateTaskDescription(creationProperties.description);

  validateTaskPriority(creationProperties.priority);

  validateTaskAssignedTo(creationProperties.assignedTo);

  validateTaskDueDate(creationProperties.dueDate);
}

export function validateTaskUpdateProperties(
  updateProperties: Readonly<TaskUpdateProperties>,
  currentStatus: TaskStatus
): asserts updateProperties is ValidTaskUpdateProperties {
  if (updateProperties.title !== undefined) {
    validateTaskTitle(updateProperties.title);
  }

  if (updateProperties.description !== undefined) {
    validateTaskDescription(updateProperties.description);
  }

  if (updateProperties.status !== undefined) {
    validateTaskStatus(updateProperties.status, currentStatus);
  }

  if (updateProperties.priority !== undefined) {
    validateTaskPriority(updateProperties.priority);
  }

  if (updateProperties.assignedTo !== undefined) {
    validateTaskAssignedTo(updateProperties.assignedTo);
  }

  if (updateProperties.dueDate !== undefined) {
    validateTaskDueDate(updateProperties.dueDate);
  }
}

function validateTaskTitle(taskTitle: string): asserts taskTitle is string {
  if (typeof taskTitle !== 'string') {
    throw new ValidationError('Task title must be a string', {
      context: { taskTitle }
    });
  }

  if (taskTitle.length === 0) {
    throw new ValidationError('Task title must not be empty', {
      context: { taskTitle }
    });
  }

  if (taskTitle.length > 200) {
    throw new ValidationError('Task title must be less than 200 characters', {
      context: { taskTitle }
    });
  }
}

function validateTaskDescription(
  taskDescription: string | null
): asserts taskDescription is string | null {
  if (taskDescription === null) {
    return;
  }

  if (typeof taskDescription !== 'string') {
    throw new ValidationError('Task description must be a string', {
      context: { taskDescription }
    });
  }

  if (taskDescription.length === 0) {
    throw new ValidationError('Task description must not be empty', {
      context: { taskDescription }
    });
  }

  if (taskDescription.length > 500) {
    throw new ValidationError(
      'Task description must be less than 500 characters',
      { context: { taskDescription } }
    );
  }
}

function validateTaskStatus(
  targetTaskStatus: TaskStatus,
  currentTaskStatus: TaskStatus
): asserts targetTaskStatus is TaskStatus {
  if (!isValidTaskStatus(targetTaskStatus)) {
    throw new ValidationError('Invalid target task status', {
      context: { targetTaskStatus }
    });
  }

  if (targetTaskStatus === currentTaskStatus) {
    throw new ValidationError(
      'Task status must be different from current status',
      { context: { targetTaskStatus, currentTaskStatus } }
    );
  }
}

function validateTaskPriority(
  taskPriority: TaskPriority
): asserts taskPriority is TaskPriority {
  if (!isValidTaskPriority(taskPriority)) {
    throw new ValidationError('Invalid task priority', {
      context: { taskPriority }
    });
  }
}

function validateTaskAssignedTo(
  taskAssignedTo: string | null
): asserts taskAssignedTo is string | null {
  if (taskAssignedTo === null) {
    return;
  }

  if (typeof taskAssignedTo !== 'string') {
    throw new ValidationError('Task assigned value must not be a string', {
      context: { taskAssignedTo }
    });
  }

  if (taskAssignedTo.length === 0) {
    throw new ValidationError('Task assigned value must not be empty', {
      context: { taskAssignedTo }
    });
  }

  if (taskAssignedTo.length > 100) {
    throw new ValidationError(
      'Task assigned value must be less than 100 characters',
      { context: { taskAssignedTo } }
    );
  }
}

function validateTaskDueDate(
  taskDueDate: Date | null
): asserts taskDueDate is Date | null {
  if (taskDueDate === null) {
    return;
  }

  if (!(taskDueDate instanceof Date) || isNaN(taskDueDate.getTime())) {
    throw new ValidationError('Task due date must not be a date object', {
      context: { taskDueDate }
    });
  }
}

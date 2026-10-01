import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  UserRole
} from '@hexagonal-ts-template/common/domain';
import {
  TaskStatus,
  type TaskManagementAuthorizationContext,
  type TaskReference
} from '../models';

export function ensureTaskReferenceExists(
  taskReference: TaskReference | null | undefined,
  context: Readonly<{
    taskId: string;
    authorizationContext: TaskManagementAuthorizationContext;
  }>
): asserts taskReference is TaskReference {
  if (!taskReference) {
    throw new NotFoundError(`Task with id ${context.taskId} not found`);
  }

  if (taskReference.id !== context.taskId) {
    throw new NotFoundError(
      `Provided task id ${context.taskId} is not matching with task reference id ${taskReference.id}`
    );
  }
}

export function ensureCanCreateTask({
  role
}: Readonly<TaskManagementAuthorizationContext>): void {
  if (role === UserRole.VIEWER) {
    throw new ForbiddenError(`${UserRole.VIEWER} cannot create tasks`);
  }

  if (role === UserRole.ADMIN || role === UserRole.MEMBER) {
    return;
  }

  throw new UnauthorizedError('User is not authenticated');
}

export function ensureCanUpdateTask({
  role
}: Readonly<TaskManagementAuthorizationContext>): void {
  if (role === UserRole.VIEWER) {
    throw new ForbiddenError(`${UserRole.VIEWER} cannot update tasks`);
  }

  if (role === UserRole.ADMIN || role === UserRole.MEMBER) {
    return;
  }

  throw new UnauthorizedError('User is not authenticated');
}

export function ensureCanDeleteTask({
  role
}: Readonly<TaskManagementAuthorizationContext>): void {
  if (role !== UserRole.ADMIN) {
    if (role === UserRole.VIEWER || role === UserRole.MEMBER) {
      throw new ForbiddenError(
        `${role.charAt(0).toUpperCase() + role.slice(1)}s cannot delete tasks`
      );
    }

    throw new UnauthorizedError('User is not authenticated');
  }
}

export function ensureCanTransitionTaskStatus(
  currentStatus: TaskStatus,
  newStatus: TaskStatus
): void {
  const validTransitions: Record<TaskStatus, TaskStatus[]> = {
    [TaskStatus.PENDING]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
    [TaskStatus.IN_PROGRESS]: [
      TaskStatus.COMPLETED,
      TaskStatus.CANCELLED,
      TaskStatus.PENDING
    ],
    [TaskStatus.COMPLETED]: [TaskStatus.CANCELLED],
    [TaskStatus.CANCELLED]: [] // Once cancelled, no further transitions
  };

  const allowedTargets = validTransitions[currentStatus];

  if (!allowedTargets.includes(newStatus)) {
    throw new ForbiddenError(
      `Cannot transition task from ${currentStatus} to ${newStatus}`
    );
  }
}

import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  UserRole
} from '@hexagonal-ts-template/common/domain';
import {
  TaskStatus,
  type ProjectId,
  type TaskId,
  type TaskManagementAuthorizationContext,
  type TaskReference
} from '../models';

export function ensureTaskReferenceExists(
  taskReference: TaskReference | null | undefined,
  context: Readonly<{
    projectId: ProjectId;
    taskId: TaskId;
  }>
): asserts taskReference is TaskReference {
  if (!taskReference) {
    throw new NotFoundError(`Task with id ${context.taskId} not found`);
  }

  if (context.projectId !== taskReference.projectId) {
    throw new NotFoundError('Task does not belong to given project', {
      context: {
        providedProjectId: context.projectId,
        referenceProjectId: taskReference.projectId
      }
    });
  }
}

export function ensureCanCreateTask({
  role
}: Readonly<TaskManagementAuthorizationContext>): void {
  if (role === UserRole.ADMIN || role === UserRole.MEMBER) {
    return;
  }

  throw new UnauthorizedError('User is not authorized to create tasks', {
    context: { role }
  });
}

export function ensureCanUpdateTask({
  role
}: Readonly<TaskManagementAuthorizationContext>): void {
  if (role === UserRole.ADMIN || role === UserRole.MEMBER) {
    return;
  }

  throw new UnauthorizedError('User is not authorized to update tasks', {
    context: { role }
  });
}

export function ensureCanDeleteTask({
  role
}: Readonly<TaskManagementAuthorizationContext>): void {
  if (role === UserRole.ADMIN) {
    return;
  }

  throw new UnauthorizedError('User is not authorized to delete tasks', {
    context: { role }
  });
}

export function ensureCanTransitionTaskStatus(
  currentStatus: TaskStatus,
  targetStatus: TaskStatus
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

  if (!allowedTargets.includes(targetStatus)) {
    throw new ForbiddenError('Cannot transition task', {
      context: { currentStatus, newStatus: targetStatus }
    });
  }
}

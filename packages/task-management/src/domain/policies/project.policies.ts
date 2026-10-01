import {
  ForbiddenError,
  NotFoundError,
  UserRole
} from '@hexagonal-ts-template/common/domain';
import type {
  ProjectId,
  ProjectReference,
  TaskManagementAuthorizationContext
} from '../models';

export function ensureProjectReferenceExists(
  projectReference: ProjectReference | null | undefined,
  context: Readonly<{ projectId: ProjectId }>
): asserts projectReference is ProjectReference {
  if (!projectReference) {
    throw new NotFoundError(`Project with id ${context.projectId} not found`);
  }
}

export function ensureCanCreateProject({
  role
}: Readonly<TaskManagementAuthorizationContext>): void {
  if (role === UserRole.VIEWER) {
    throw new ForbiddenError(`${UserRole.VIEWER} cannot create projects`);
  }

  if (role === UserRole.ADMIN || role === UserRole.MEMBER) {
    return;
  }

  throw new ForbiddenError('User is not authorized to create projects');
}

export function ensureCanUpdateProject({
  role
}: Readonly<TaskManagementAuthorizationContext>): void {
  if (role === UserRole.VIEWER) {
    throw new ForbiddenError(`${UserRole.VIEWER} cannot update projects`);
  }

  if (role === UserRole.ADMIN || role === UserRole.MEMBER) {
    return;
  }

  throw new ForbiddenError('User is not authorized to update projects');
}

export function ensureCanDeleteProject({
  role
}: Readonly<TaskManagementAuthorizationContext>): void {
  if (role !== UserRole.ADMIN) {
    if (role === UserRole.VIEWER || role === UserRole.MEMBER) {
      throw new ForbiddenError(
        `${role.charAt(0).toUpperCase() + role.slice(1)}s cannot delete projects`
      );
    }

    throw new ForbiddenError('User is not authorized to delete projects');
  }
}

import type { UserRole } from '@hexagonal-ts-template/common/domain';
import type { ProjectId } from './project';
import type { TenantId } from './tenant';

export interface TaskManagementAuthorizationContext {
  readonly tenantId: TenantId;
  readonly projectId: ProjectId | null;
  readonly role: UserRole;
}

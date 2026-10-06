import type { Brand, UserRole } from '@hexagonal-ts-template/common/domain';

export type UserId = Brand<string, 'UserId'>;
export type TenantId = Brand<string, 'TenantId'>;

export interface User {
  readonly id: UserId;
  readonly tenantId: TenantId;
  readonly email: string;
  readonly name: string | null;
  readonly role: UserRole;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

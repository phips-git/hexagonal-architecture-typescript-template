import { UserRole } from '@hexagonal-ts-template/common/domain';
import type { TenantId, User, UserId } from '../../domain/models';
import type { AuthenticationPort } from '../../domain/ports';

export class NoOpAuthenticationAdapter implements AuthenticationPort {
  constructor(
    private readonly config: {
      defaultId?: string;
      defaultEmail?: string;
      defaultRole?: UserRole;
    } = {}
  ) {}

  async authenticateRequest(
    headers: Record<string, string>
  ): Promise<User | null> {
    const id =
      headers['x-dev-user-id'] || this.config.defaultId || 'dev-user-123';
    const email =
      headers['x-dev-user-email'] ||
      this.config.defaultEmail ||
      'dev@example.com';
    const role = (headers['x-dev-user-role'] ||
      this.config.defaultRole ||
      'member') as UserRole;

    return {
      id: id as unknown as UserId,
      tenantId: id as unknown as TenantId,
      email,
      name: null,
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

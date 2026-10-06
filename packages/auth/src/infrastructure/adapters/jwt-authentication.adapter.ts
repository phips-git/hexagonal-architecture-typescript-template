import { UserRole } from '@hexagonal-ts-template/common/domain';
import { jwtVerify, type KeyInput } from 'jose';
import type { TenantId, User, UserId } from '../../domain/models';
import type { AuthenticationPort } from '../../domain/ports';

export class JwtAuthenticationAdapter implements AuthenticationPort {
  static readonly SECURE_ALGORITHMS = [
    'RS256',
    'RS384',
    'RS512',
    'ES256',
    'ES384',
    'ES512'
  ] as const;

  constructor(
    private readonly config: {
      secretOrPrivateKey: KeyInput;
      algorithm?: (typeof JwtAuthenticationAdapter.SECURE_ALGORITHMS)[number];
      expiresIn?: number;
      issuer: string;
      audience: string | string[];
    }
  ) {
    if (!config.issuer || !config.audience) {
      throw new Error('issuer and audience are required');
    }

    const alg = config.algorithm || 'RS256';
    if (!JwtAuthenticationAdapter.SECURE_ALGORITHMS.includes(alg)) {
      throw new Error(`Algorithm ${alg} is not in secure whitelist`);
    }
  }

  async authenticateRequest(
    headers: Record<string, string>
  ): Promise<User | null> {
    try {
      const authHeader = headers['authorization'];

      if (!authHeader?.startsWith('Bearer ')) {
        return null;
      }

      const token = authHeader.substring(7);

      if (!token) {
        return null;
      }

      const { payload } = await jwtVerify(
        token,
        this.config.secretOrPrivateKey,
        {
          algorithms: [this.config.algorithm || 'RS256'],
          issuer: this.config.issuer,
          audience: Array.isArray(this.config.audience)
            ? this.config.audience
            : [this.config.audience]
        }
      );

      if (!payload.sub) {
        return null;
      }

      const email = payload['email'] as string | undefined;
      const role = payload['role'] as string | undefined;

      return {
        id: payload.sub as unknown as UserId,
        tenantId: payload.sub as unknown as TenantId,
        email: email || '',
        name: null,
        role: (role as UserRole) || 'member',
        createdAt: new Date(0),
        updatedAt: new Date(0)
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'JWTExpired') {
        return null;
      }

      return null;
    }
  }
}

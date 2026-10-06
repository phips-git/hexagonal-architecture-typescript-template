import type { APIGatewayProxyEvent } from 'aws-lambda';
import { getGetAuthenticatedUserUsecase } from './usecase-factory';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export async function authenticateUser(
  event: APIGatewayProxyEvent
): Promise<AuthenticatedUser | null> {
  try {
    const usecase = getGetAuthenticatedUserUsecase();
    const user = await usecase.execute({
      headers: Object.fromEntries(
        Object.entries(event.headers).filter(
          ([_, value]) => value !== undefined
        )
      ) as Record<string, string>
    });

    return user;
  } catch (error) {
    return null;
  }
}

export function createTaskManagementAuthorizationContext(
  user: AuthenticatedUser | null,
  projectId?: string | null
): {
  authorizationContext: {
    tenantId: string;
    projectId: string | null;
    role: string;
  };
  user: AuthenticatedUser | null;
} {
  if (!user) {
    return {
      authorizationContext: {
        tenantId: 'default-tenant',
        projectId: null,
        role: 'member'
      },
      user: null
    };
  }

  return {
    authorizationContext: {
      tenantId: user.id,
      projectId: projectId || null,
      role: user.role
    },
    user
  };
}

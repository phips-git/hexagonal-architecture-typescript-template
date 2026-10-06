import type { User } from '@hexagonal-ts-template/auth/domain';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { getGetAuthenticatedUserUsecase } from './usecase-factory';

export type { User as AuthenticatedUser };

export async function authenticateUser(
  event: APIGatewayProxyEvent
): Promise<User | null> {
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
  } catch {
    return null;
  }
}

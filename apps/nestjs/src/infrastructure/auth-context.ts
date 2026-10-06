import { GetAuthenticatedUserUsecase } from '@hexagonal-ts-template/auth/application';

export async function authenticateRequest(
  headers: Record<string, string | undefined>,
  getAuthenticatedUserUsecase: GetAuthenticatedUserUsecase
): Promise<
  | { user: Awaited<ReturnType<GetAuthenticatedUserUsecase['execute']>> }
  | { error: 'unauthorized' }
> {
  const user = await getAuthenticatedUserUsecase.execute({
    headers: Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k, v ?? ''])
    )
  });
  if (!user) return { error: 'unauthorized' };
  return { user };
}

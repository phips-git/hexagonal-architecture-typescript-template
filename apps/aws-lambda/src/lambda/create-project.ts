import type { UserRole } from '@hexagonal-ts-template/common/domain';
import type {
  ProjectCreationProperties,
  TaskManagementAuthorizationContext,
  TenantId
} from '@hexagonal-ts-template/task-management/domain';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context
} from 'aws-lambda';
import { authenticateUser } from './shared/auth';
import { UnauthorizedError, ValidationApiError } from './shared/errors';
import { getCreateProjectUsecase } from './shared/usecase-factory';

interface CreateProjectBody {
  name: string;
  description?: string;
}

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;

  try {
    const user = await authenticateUser(event);
    if (!user) {
      throw new UnauthorizedError();
    }

    let body: CreateProjectBody;
    if (!event.body) {
      throw new ValidationApiError('Request body is required');
    }

    try {
      body = JSON.parse(event.body);
    } catch {
      throw new ValidationApiError('Invalid JSON in request body');
    }

    const { name, description } = body;
    if (!name) {
      throw new ValidationApiError('Project name is required');
    }

    const authorizationContext: TaskManagementAuthorizationContext = {
      tenantId: user.id as TenantId,
      projectId: null,
      role: user.role as UserRole
    };

    const creationProperties: ProjectCreationProperties = {
      name,
      description: description ?? null
    };

    await getCreateProjectUsecase().execute({
      authorizationContext,
      creationProperties
    });

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return buildErrorResponse(error, requestId);
  }
};

function buildErrorResponse(
  error: unknown,
  requestId: string
): APIGatewayProxyResult {
  if (error instanceof UnauthorizedError) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        code: error.code,
        requestId
      })
    };
  }

  if (error instanceof ValidationApiError) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        code: error.code,
        requestId
      })
    };
  }

  return {
    statusCode: 500,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      error: error instanceof Error ? error.message : String(error),
      code: 'INTERNAL_ERROR',
      requestId
    })
  };
}

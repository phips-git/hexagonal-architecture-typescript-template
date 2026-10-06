import type { UserRole } from '@hexagonal-ts-template/common/domain';
import type {
  ProjectId,
  ProjectUpdateProperties,
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
import { getUpdateProjectUsecase } from './shared/usecase-factory';

interface UpdateProjectBody {
  updateProperties: {
    name?: string;
    description?: string;
  };
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

    let body: UpdateProjectBody;
    if (!event.body) {
      throw new ValidationApiError('Request body is required');
    }

    try {
      body = JSON.parse(event.body);
    } catch {
      throw new ValidationApiError('Invalid JSON in request body');
    }

    const { updateProperties } = body;
    if (!updateProperties || Object.keys(updateProperties).length === 0) {
      throw new ValidationApiError('At least one field to update is required');
    }

    const projectId = event.pathParameters?.['id'];
    if (!projectId) {
      throw new ValidationApiError('Project ID is required');
    }

    const authorizationContext: TaskManagementAuthorizationContext = {
      tenantId: user.id as TenantId,
      projectId: projectId as ProjectId,
      role: user.role as UserRole
    };

    const updatePropertiesTyped = {
      name: updateProperties.name,
      description: updateProperties.description
    };

    await getUpdateProjectUsecase().execute({
      authorizationContext,
      projectId: projectId as ProjectId,
      updateProperties: updatePropertiesTyped as ProjectUpdateProperties
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
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
};

import type { UserRole } from '@hexagonal-ts-template/common/domain';
import type {
  ProjectId,
  TaskId,
  TaskManagementAuthorizationContext,
  TenantId
} from '@hexagonal-ts-template/task-management/domain';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context
} from 'aws-lambda';
import { authenticateUser } from './shared/auth';
import { getDeleteTaskUsecase } from './shared/usecase-factory';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const requestId = context.awsRequestId;

  try {
    const user = await authenticateUser(event);
    if (!user) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
          requestId
        })
      };
    }

    const projectId = event.pathParameters?.['projectId'];
    const taskId = event.pathParameters?.['taskId'];

    if (!projectId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Project ID is required',
          code: 'VALIDATION_ERROR',
          requestId
        })
      };
    }

    if (!taskId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Task ID is required',
          code: 'VALIDATION_ERROR',
          requestId
        })
      };
    }

    const authorizationContext: TaskManagementAuthorizationContext = {
      tenantId: user.id as TenantId,
      projectId: projectId as ProjectId,
      role: user.role as UserRole
    };

    await getDeleteTaskUsecase().execute({
      authorizationContext,
      projectId: projectId as ProjectId,
      taskId: taskId as TaskId
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

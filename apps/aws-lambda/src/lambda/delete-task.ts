import type {
  ProjectId,
  TaskId,
  TaskManagementAuthorizationContext
} from '@hexagonal-ts-template/task-management/domain';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context
} from 'aws-lambda';
import { buildLambdaErrorResponse, getDeleteTaskUsecase } from './shared';
import { authenticateUser } from './shared/auth';

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
      tenantId: user.tenantId,
      projectId: projectId as ProjectId,
      role: user.role
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
    return buildLambdaErrorResponse(error, requestId);
  }
};

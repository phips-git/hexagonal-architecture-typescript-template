import type { UserRole } from '@hexagonal-ts-template/common/domain';
import type {
  ProjectId,
  TaskId,
  TaskManagementAuthorizationContext,
  TaskPriority,
  TaskStatus,
  TaskUpdateProperties,
  TenantId
} from '@hexagonal-ts-template/task-management/domain';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context
} from 'aws-lambda';
import { authenticateUser } from './shared/auth';
import { UnauthorizedError, ValidationApiError } from './shared/errors';
import { getUpdateTaskUsecase } from './shared/usecase-factory';

interface UpdateTaskBody {
  updateProperties: {
    title?: string;
    description?: string;
    priority?: number;
    status?: string;
    assignedTo?: string;
    dueDate?: string;
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

    let body: UpdateTaskBody;
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

    const projectId = event.pathParameters?.['projectId'];
    const taskId = event.pathParameters?.['taskId'];

    if (!projectId) {
      throw new ValidationApiError('Project ID is required');
    }
    if (!taskId) {
      throw new ValidationApiError('Task ID is required');
    }

    const authorizationContext: TaskManagementAuthorizationContext = {
      tenantId: user.id as TenantId,
      projectId: projectId as ProjectId,
      role: user.role as UserRole
    };

    const updatePropertiesTyped = {
      title: updateProperties.title,
      description: updateProperties.description ?? null,
      priority: updateProperties.priority as TaskPriority | undefined,
      status: updateProperties.status as TaskStatus | undefined,
      assignedTo: updateProperties.assignedTo ?? null,
      dueDate: updateProperties.dueDate
        ? new Date(updateProperties.dueDate)
        : null
    };

    await getUpdateTaskUsecase().execute({
      authorizationContext,
      projectId: projectId as ProjectId,
      taskId: taskId as TaskId,
      updateProperties: updatePropertiesTyped as TaskUpdateProperties
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

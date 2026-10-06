import type { UserRole } from '@hexagonal-ts-template/common/domain';
import type {
  ProjectId,
  TaskCreationProperties,
  TaskManagementAuthorizationContext,
  TaskPriority,
  TenantId
} from '@hexagonal-ts-template/task-management/domain';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context
} from 'aws-lambda';
import { authenticateUser } from './shared/auth';
import { UnauthorizedError, ValidationApiError } from './shared/errors';
import { getCreateTaskUsecase } from './shared/usecase-factory';

interface CreateTaskBody {
  title: string;
  description?: string;
  priority?: number;
  assignedTo?: string;
  dueDate?: string;
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

    let body: CreateTaskBody;
    if (!event.body) {
      throw new ValidationApiError('Request body is required');
    }

    try {
      body = JSON.parse(event.body);
    } catch {
      throw new ValidationApiError('Invalid JSON in request body');
    }

    const { title, description, priority, assignedTo, dueDate } = body;
    if (!title) {
      throw new ValidationApiError('Task title is required');
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

    const creationProperties: TaskCreationProperties = {
      title,
      description: description ?? null,
      priority: (priority ?? 0) as unknown as TaskPriority,
      assignedTo: assignedTo ?? null,
      dueDate: dueDate ? new Date(dueDate) : null
    };

    await getCreateTaskUsecase().execute({
      authorizationContext,
      projectId: projectId as ProjectId,
      creationProperties
    });

    return {
      statusCode: 201,
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

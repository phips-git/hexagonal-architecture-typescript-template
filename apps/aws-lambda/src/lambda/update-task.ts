import {
  createConsoleLogger,
  SqliteDatabaseClient
} from '@hexagonal-ts-template/common/infrastructure';
import { UpdateTaskUsecase } from '@hexagonal-ts-template/task-management/application';
import type {
  ProjectId,
  TaskId
} from '@hexagonal-ts-template/task-management/domain';
import { SqliteTaskPersistencePort } from '@hexagonal-ts-template/task-management/infrastructure';
import type { APIGatewayProxyResult, Context } from 'aws-lambda';
import { nanoid } from 'nanoid';

let databaseClient: SqliteDatabaseClient | null = null;
let updateTaskUsecase: UpdateTaskUsecase | null = null;

async function getUpdateTaskUsecase(): Promise<UpdateTaskUsecase> {
  if (!updateTaskUsecase) {
    const client = databaseClient ?? (await SqliteDatabaseClient.create());
    const db = client.getDatabase();

    const usecaseExectionDependencies = {
      generateId: <T>() => nanoid() as T,
      loggerFactory: () => createConsoleLogger('UpdateTaskUsecase')
    };
    const taskPersistence = new SqliteTaskPersistencePort(db);

    updateTaskUsecase = new UpdateTaskUsecase(
      usecaseExectionDependencies,
      taskPersistence
    );
  }
  return updateTaskUsecase;
}

export const handler = async (
  event: {
    body: string | null;
    pathParameters?: { projectId: string; taskId: string };
  },
  context: Context
): Promise<APIGatewayProxyResult> => {
  const body = event.body ? JSON.parse(event.body) : {};

  // TODO: Validate body with schema of UpdateTaskInput

  try {
    const usecase = await getUpdateTaskUsecase();

    await usecase.execute({
      // TODO: Get authorization context from auth layer
      authorizationContext: body.authorizationContext,
      projectId: event.pathParameters?.projectId as ProjectId,
      taskId: event.pathParameters?.taskId as TaskId,
      updateProperties: body.updateProperties
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: errorMessage,
        requestId: context.awsRequestId
      })
    };
  }
};

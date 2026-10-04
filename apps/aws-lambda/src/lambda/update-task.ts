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

const loggerFactory = () => createConsoleLogger('UpdateTaskUsecase');

let databaseClient: SqliteDatabaseClient | null = null;
let updateTaskUsecase: UpdateTaskUsecase | null = null;

async function getDatabaseClient(): Promise<SqliteDatabaseClient> {
  if (!databaseClient) {
    const { initializeSchema } =
      await import('@hexagonal-ts-template/task-management/infrastructure');
    databaseClient = await SqliteDatabaseClient.create();
    await initializeSchema(databaseClient.getDatabase());
  }
  return databaseClient;
}

async function getUpdateTaskUsecase(): Promise<UpdateTaskUsecase> {
  if (!updateTaskUsecase) {
    const client = await getDatabaseClient();
    const db = client.getDatabase();
    const taskPersistence = new SqliteTaskPersistencePort(db);

    updateTaskUsecase = new UpdateTaskUsecase(
      { generateId: () => require('uuid').v4(), loggerFactory },
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

  try {
    const usecase = await getUpdateTaskUsecase();

    await usecase.execute({
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

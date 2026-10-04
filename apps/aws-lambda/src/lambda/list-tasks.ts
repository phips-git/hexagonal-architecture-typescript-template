import {
  createConsoleLogger,
  SqliteDatabaseClient
} from '@hexagonal-ts-template/common/infrastructure';
import { ListTasksUsecase } from '@hexagonal-ts-template/task-management/application';
import type { ProjectId } from '@hexagonal-ts-template/task-management/domain';
import { SqliteTaskPersistencePort } from '@hexagonal-ts-template/task-management/infrastructure';
import type { APIGatewayProxyResult, Context } from 'aws-lambda';

const loggerFactory = () => createConsoleLogger('ListTasksUsecase');

let databaseClient: SqliteDatabaseClient | null = null;
let listTasksUsecase: ListTasksUsecase | null = null;

async function getDatabaseClient(): Promise<SqliteDatabaseClient> {
  if (!databaseClient) {
    const { initializeSchema } =
      await import('@hexagonal-ts-template/task-management/infrastructure');
    databaseClient = await SqliteDatabaseClient.create();
    await initializeSchema(databaseClient.getDatabase());
  }
  return databaseClient;
}

async function getListTasksUsecase(): Promise<ListTasksUsecase> {
  if (!listTasksUsecase) {
    const client = await getDatabaseClient();
    const db = client.getDatabase();
    const taskPersistence = new SqliteTaskPersistencePort(db);

    listTasksUsecase = new ListTasksUsecase(
      { generateId: () => require('uuid').v4(), loggerFactory },
      taskPersistence
    );
  }
  return listTasksUsecase;
}

export const handler = async (
  event: { body: string | null; pathParameters?: { id: string } },
  context: Context
): Promise<APIGatewayProxyResult> => {
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    const usecase = await getListTasksUsecase();

    await usecase.execute({
      authorizationContext: body.authorizationContext,
      projectId: event.pathParameters?.id as ProjectId
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

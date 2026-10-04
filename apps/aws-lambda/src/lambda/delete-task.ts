import {
  createConsoleLogger,
  SqliteDatabaseClient,
  UnitOfWorkDatabaseAdapter
} from '@hexagonal-ts-template/common/infrastructure';
import { DeleteTaskUsecase } from '@hexagonal-ts-template/task-management/application';
import type {
  ProjectId,
  TaskId
} from '@hexagonal-ts-template/task-management/domain';
import {
  SqliteProjectStatsPersistencePort,
  SqliteTaskPersistencePort
} from '@hexagonal-ts-template/task-management/infrastructure';
import type { APIGatewayProxyResult, Context } from 'aws-lambda';
import { nanoid } from 'nanoid';

let databaseClient: SqliteDatabaseClient | null = null;
let deleteTaskUsecase: DeleteTaskUsecase | null = null;

async function getDeleteTaskUsecase(): Promise<DeleteTaskUsecase> {
  if (!deleteTaskUsecase) {
    const client = databaseClient ?? (await SqliteDatabaseClient.create());
    const db = client.getDatabase();

    const usecaseExectionDependencies = {
      generateId: <T>() => nanoid() as T,
      loggerFactory: () => createConsoleLogger('DeleteTaskUsecase')
    };
    const unitOfWork = new UnitOfWorkDatabaseAdapter(client);
    const taskPersistence = new SqliteTaskPersistencePort(db);
    const projectStatsPersistence = new SqliteProjectStatsPersistencePort(db);

    deleteTaskUsecase = new DeleteTaskUsecase(
      usecaseExectionDependencies,
      taskPersistence,
      unitOfWork,
      projectStatsPersistence
    );
  }

  return deleteTaskUsecase;
}

export const handler = async (
  event: {
    body: string | null;
    pathParameters?: { projectId: string; taskId: string };
  },
  context: Context
): Promise<APIGatewayProxyResult> => {
  const body = event.body ? JSON.parse(event.body) : {};

  // TODO: Validate body to have schema of DeleteTaskInput

  try {
    const usecase = await getDeleteTaskUsecase();

    await usecase.execute({
      // TODO: Get authorization context from auth layer
      authorizationContext: body.authorizationContext,
      projectId: event.pathParameters?.projectId as ProjectId,
      taskId: event.pathParameters?.taskId as TaskId
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

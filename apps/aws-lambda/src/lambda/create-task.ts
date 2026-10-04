import {
  createConsoleLogger,
  SqliteDatabaseClient,
  UnitOfWorkDatabaseAdapter
} from '@hexagonal-ts-template/common/infrastructure';
import { CreateTaskUsecase } from '@hexagonal-ts-template/task-management/application';
import type { ProjectId } from '@hexagonal-ts-template/task-management/domain';
import {
  SqliteProjectPersistencePort,
  SqliteProjectStatsPersistencePort,
  SqliteTaskPersistencePort
} from '@hexagonal-ts-template/task-management/infrastructure';
import type { APIGatewayProxyResult, Context } from 'aws-lambda';
import { nanoid } from 'nanoid';

let databaseClient: SqliteDatabaseClient | null = null;
let createTaskUsecase: CreateTaskUsecase | null = null;

async function getCreateTaskUsecase(): Promise<CreateTaskUsecase> {
  if (!createTaskUsecase) {
    const client = databaseClient ?? (await SqliteDatabaseClient.create());
    const db = client.getDatabase();

    const usecaseExectionDependencies = {
      generateId: <T>() => nanoid() as T,
      loggerFactory: () => createConsoleLogger('CreateTaskUsecase')
    };
    const projectPersistence = new SqliteProjectPersistencePort(db);
    const unitOfWork = new UnitOfWorkDatabaseAdapter(client);
    const taskPersistence = new SqliteTaskPersistencePort(db);
    const projectStatsPersistence = new SqliteProjectStatsPersistencePort(db);

    createTaskUsecase = new CreateTaskUsecase(
      usecaseExectionDependencies,
      projectPersistence,
      unitOfWork,
      taskPersistence,
      projectStatsPersistence
    );
  }

  return createTaskUsecase;
}

export const handler = async (
  event: { body: string | null; pathParameters?: { id: string } },
  context: Context
): Promise<APIGatewayProxyResult> => {
  const body = event.body ? JSON.parse(event.body) : {};

  // TODO: Validate body with schema of CreateTaskInput

  try {
    const usecase = await getCreateTaskUsecase();
    await usecase.execute({
      // TODO: Get authorization context from auth layer
      authorizationContext: body.authorizationContext,
      projectId: event.pathParameters?.id as ProjectId,
      creationProperties: body.creationProperties
    });

    return {
      statusCode: 201,
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

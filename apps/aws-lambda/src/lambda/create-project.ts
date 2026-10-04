import {
  createConsoleLogger,
  SqliteDatabaseClient
} from '@hexagonal-ts-template/common/infrastructure';
import { CreateProjectUsecase } from '@hexagonal-ts-template/task-management/application';
import { SqliteProjectPersistencePort } from '@hexagonal-ts-template/task-management/infrastructure';
import type { APIGatewayProxyResult, Context } from 'aws-lambda';
import { nanoid } from 'nanoid';

let databaseClient: SqliteDatabaseClient | null = null;
let createProjectUsecase: CreateProjectUsecase | null = null;

async function getCreateProjectUsecase(): Promise<CreateProjectUsecase> {
  if (!createProjectUsecase) {
    const client = databaseClient ?? (await SqliteDatabaseClient.create());
    const db = client.getDatabase();

    const usecaseExectionDependencies = {
      generateId: <T>() => nanoid() as T,
      loggerFactory: () => createConsoleLogger('CreateProjectUsecase')
    };
    const projectPersistence = new SqliteProjectPersistencePort(db);

    createProjectUsecase = new CreateProjectUsecase(
      usecaseExectionDependencies,
      projectPersistence
    );
  }

  return createProjectUsecase;
}

export const handler = async (
  event: { body: string | null },
  context: Context
): Promise<APIGatewayProxyResult> => {
  const body = event.body ? JSON.parse(event.body) : {};

  // TODO: Validate body to have schema of CreateProjectInput

  try {
    const usecase = await getCreateProjectUsecase();
    await usecase.execute({
      // TODO: Get authorization context from auth layer
      authorizationContext: body.authorizationContext,
      creationProperties: body.creationProperties
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

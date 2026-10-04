import {
  createConsoleLogger,
  SqliteDatabaseClient
} from '@hexagonal-ts-template/common/infrastructure';
import { UpdateProjectUsecase } from '@hexagonal-ts-template/task-management/application';
import type { ProjectId } from '@hexagonal-ts-template/task-management/domain';
import { SqliteProjectPersistencePort } from '@hexagonal-ts-template/task-management/infrastructure';
import type { APIGatewayProxyResult, Context } from 'aws-lambda';
import { nanoid } from 'nanoid';

let databaseClient: SqliteDatabaseClient | null = null;
let updateProjectUsecase: UpdateProjectUsecase | null = null;

async function getUpdateProjectUsecase(): Promise<UpdateProjectUsecase> {
  if (!updateProjectUsecase) {
    const client = databaseClient ?? (await SqliteDatabaseClient.create());
    const db = client.getDatabase();

    const usecaseExectionDependencies = {
      generateId: <T>() => nanoid() as T,
      loggerFactory: () => createConsoleLogger('UpdateProjectUsecase')
    };
    const projectPersistence = new SqliteProjectPersistencePort(db);

    updateProjectUsecase = new UpdateProjectUsecase(
      usecaseExectionDependencies,
      projectPersistence
    );
  }

  return updateProjectUsecase;
}

export const handler = async (
  event: { body: string | null; pathParameters?: { id: string } },
  context: Context
): Promise<APIGatewayProxyResult> => {
  const body = event.body ? JSON.parse(event.body) : {};

  // TODO: Validate body with schema of UpdateProjectInput

  try {
    const usecase = await getUpdateProjectUsecase();

    await usecase.execute({
      // TODO: Get authorization context from auth layer
      authorizationContext: body.authorizationContext,
      projectId: event.pathParameters?.id as ProjectId,
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

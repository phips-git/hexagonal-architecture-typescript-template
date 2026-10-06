import { GetAuthenticatedUserUsecase } from '@hexagonal-ts-template/auth/application';
import {
  JwtAuthenticationAdapter,
  NoOpUserPersistenceAdapter
} from '@hexagonal-ts-template/auth/infrastructure';
import {
  createConsoleLogger,
  SqliteUnitOfWorkAdapter
} from '@hexagonal-ts-template/common/infrastructure';
import {
  CreateProjectUsecase,
  CreateTaskUsecase,
  DeleteProjectUsecase,
  DeleteTaskUsecase,
  ListTasksUsecase,
  UpdateProjectUsecase,
  UpdateTaskUsecase
} from '@hexagonal-ts-template/task-management/application';
import {
  SqliteProjectPersistenceAdapter,
  SqliteProjectStatsPersistenceAdapter,
  SqliteTaskPersistenceAdapter
} from '@hexagonal-ts-template/task-management/infrastructure';
import { nanoid } from 'nanoid';
import { getDatabase } from './database';

export function getCreateTaskUsecase() {
  const db = getDatabase();
  const projectPersistence = new SqliteProjectPersistenceAdapter(db);
  const unitOfWork = new SqliteUnitOfWorkAdapter(db);
  const taskPersistence = new SqliteTaskPersistenceAdapter(db);
  const projectStatsPersistence = new SqliteProjectStatsPersistenceAdapter(db);

  return new CreateTaskUsecase(
    {
      generateId: <T>() => nanoid() as T,
      loggerFactory: () => createConsoleLogger('CreateTaskUsecase')
    },
    projectPersistence,
    unitOfWork,
    taskPersistence,
    projectStatsPersistence
  );
}

export function getUpdateTaskUsecase() {
  const db = getDatabase();
  const taskPersistence = new SqliteTaskPersistenceAdapter(db);

  return new UpdateTaskUsecase(
    {
      generateId: <T>() => nanoid() as T,
      loggerFactory: () => createConsoleLogger('UpdateTaskUsecase')
    },
    taskPersistence
  );
}

export function getDeleteTaskUsecase() {
  const db = getDatabase();
  const unitOfWork = new SqliteUnitOfWorkAdapter(db);
  const taskPersistence = new SqliteTaskPersistenceAdapter(db);
  const projectStatsPersistence = new SqliteProjectStatsPersistenceAdapter(db);

  return new DeleteTaskUsecase(
    {
      generateId: <T>() => nanoid() as T,
      loggerFactory: () => createConsoleLogger('DeleteTaskUsecase')
    },
    taskPersistence,
    unitOfWork,
    projectStatsPersistence
  );
}

export function getListTasksUsecase() {
  const db = getDatabase();
  const taskPersistence = new SqliteTaskPersistenceAdapter(db);

  return new ListTasksUsecase(
    {
      generateId: <T>() => nanoid() as T,
      loggerFactory: () => createConsoleLogger('ListTasksUsecase')
    },
    taskPersistence
  );
}

export function getCreateProjectUsecase() {
  const db = getDatabase();
  const projectPersistence = new SqliteProjectPersistenceAdapter(db);

  return new CreateProjectUsecase(
    {
      generateId: <T>() => nanoid() as T,
      loggerFactory: () => createConsoleLogger('CreateProjectUsecase')
    },
    projectPersistence
  );
}

export function getUpdateProjectUsecase() {
  const db = getDatabase();
  const projectPersistence = new SqliteProjectPersistenceAdapter(db);

  return new UpdateProjectUsecase(
    {
      generateId: <T>() => nanoid() as T,
      loggerFactory: () => createConsoleLogger('UpdateProjectUsecase')
    },
    projectPersistence
  );
}

export function getDeleteProjectUsecase() {
  const db = getDatabase();
  const projectPersistence = new SqliteProjectPersistenceAdapter(db);

  return new DeleteProjectUsecase(
    {
      generateId: <T>() => nanoid() as T,
      loggerFactory: () => createConsoleLogger('DeleteProjectUsecase')
    },
    projectPersistence
  );
}

export function getGetAuthenticatedUserUsecase() {
  const secret = process.env['JWT_SECRET'] ?? 'dev-secret';
  const authAdapter = new JwtAuthenticationAdapter({
    secretOrPrivateKey: secret as any,
    issuer: 'dev-app',
    audience: 'dev-api'
  });

  const userPersistence = new NoOpUserPersistenceAdapter();

  return new GetAuthenticatedUserUsecase(
    {
      generateId: <T>() => nanoid() as T,
      loggerFactory: () => createConsoleLogger('GetAuthenticatedUserUsecase')
    },
    authAdapter,
    userPersistence
  );
}

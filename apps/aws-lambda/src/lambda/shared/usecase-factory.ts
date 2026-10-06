import { GetAuthenticatedUserUsecase } from '@hexagonal-ts-template/auth/application';
import {
  JwtAuthenticationAdapter,
  NoOpUserPersistenceAdapter
} from '@hexagonal-ts-template/auth/infrastructure';
import {
  createConsoleLogger,
  NanoidGeneratorAdapter,
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
import { getDatabase } from './database';

class Container {
  private static db: any = undefined;
  private static projectPersistence:
    SqliteProjectPersistenceAdapter | undefined = undefined;
  private static taskPersistence: SqliteTaskPersistenceAdapter | undefined =
    undefined;
  private static unitOfWork: SqliteUnitOfWorkAdapter | undefined = undefined;
  private static projectStatsPersistence:
    SqliteProjectStatsPersistenceAdapter | undefined = undefined;
  private static generator: NanoidGeneratorAdapter | undefined = undefined;

  static getDb() {
    if (!this.db) {
      this.db = getDatabase();
    }
    return this.db;
  }

  static getProjectPersistence() {
    if (!this.projectPersistence) {
      this.projectPersistence = new SqliteProjectPersistenceAdapter(
        this.getDb()
      );
    }
    return this.projectPersistence;
  }

  static getTaskPersistence() {
    if (!this.taskPersistence) {
      this.taskPersistence = new SqliteTaskPersistenceAdapter(this.getDb());
    }
    return this.taskPersistence;
  }

  static getUnitOfWork() {
    if (!this.unitOfWork) {
      this.unitOfWork = new SqliteUnitOfWorkAdapter(this.getDb());
    }
    return this.unitOfWork;
  }

  static getProjectStatsPersistence() {
    if (!this.projectStatsPersistence) {
      this.projectStatsPersistence = new SqliteProjectStatsPersistenceAdapter(
        this.getDb()
      );
    }
    return this.projectStatsPersistence;
  }

  static getGenerator() {
    if (!this.generator) {
      this.generator = new NanoidGeneratorAdapter();
    }
    return this.generator;
  }
}

export function getCreateTaskUsecase() {
  return new CreateTaskUsecase(
    {
      generateId: Container.getGenerator().generate,
      loggerFactory: () => createConsoleLogger('CreateTaskUsecase')
    },
    Container.getProjectPersistence(),
    Container.getUnitOfWork(),
    Container.getTaskPersistence(),
    Container.getProjectStatsPersistence()
  );
}

export function getUpdateTaskUsecase() {
  return new UpdateTaskUsecase(
    {
      generateId: Container.getGenerator().generate,
      loggerFactory: () => createConsoleLogger('UpdateTaskUsecase')
    },
    Container.getTaskPersistence()
  );
}

export function getDeleteTaskUsecase() {
  return new DeleteTaskUsecase(
    {
      generateId: Container.getGenerator().generate,
      loggerFactory: () => createConsoleLogger('DeleteTaskUsecase')
    },
    Container.getTaskPersistence(),
    Container.getUnitOfWork(),
    Container.getProjectStatsPersistence()
  );
}

export function getListTasksUsecase() {
  return new ListTasksUsecase(
    {
      generateId: Container.getGenerator().generate,
      loggerFactory: () => createConsoleLogger('ListTasksUsecase')
    },
    Container.getTaskPersistence()
  );
}

export function getCreateProjectUsecase() {
  return new CreateProjectUsecase(
    {
      generateId: Container.getGenerator().generate,
      loggerFactory: () => createConsoleLogger('CreateProjectUsecase')
    },
    Container.getProjectPersistence()
  );
}

export function getUpdateProjectUsecase() {
  return new UpdateProjectUsecase(
    {
      generateId: Container.getGenerator().generate,
      loggerFactory: () => createConsoleLogger('UpdateProjectUsecase')
    },
    Container.getProjectPersistence()
  );
}

export function getDeleteProjectUsecase() {
  return new DeleteProjectUsecase(
    {
      generateId: Container.getGenerator().generate,
      loggerFactory: () => createConsoleLogger('DeleteProjectUsecase')
    },
    Container.getProjectPersistence()
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
      generateId: Container.getGenerator().generate,
      loggerFactory: () => createConsoleLogger('GetAuthenticatedUserUsecase')
    },
    authAdapter,
    userPersistence
  );
}

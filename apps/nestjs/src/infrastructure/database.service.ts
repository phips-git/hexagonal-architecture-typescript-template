import type {
  AuthenticationPort,
  UserPersistencePort
} from '@hexagonal-ts-template/auth/domain';
import {
  JwtAuthenticationAdapter,
  NoOpUserPersistenceAdapter
} from '@hexagonal-ts-template/auth/infrastructure';
import {
  createConsoleLogger,
  NanoidGeneratorAdapter,
  SqliteUnitOfWorkAdapter
} from '@hexagonal-ts-template/common/infrastructure';
import type {
  ProjectPersistencePort,
  ProjectStatsPersistencePort,
  TaskPersistencePort
} from '@hexagonal-ts-template/task-management/domain';
import {
  SqliteProjectPersistenceAdapter,
  SqliteProjectStatsPersistenceAdapter,
  SqliteTaskPersistenceAdapter
} from '@hexagonal-ts-template/task-management/infrastructure';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Database from 'better-sqlite3';

export interface PersistencePorts {
  authenticationPort: AuthenticationPort;
  userPersistence: UserPersistencePort;
  taskPersistence: TaskPersistencePort;
  projectPersistence: ProjectPersistencePort;
  projectStatsPersistence: ProjectStatsPersistencePort;
  generator: NanoidGeneratorAdapter;
}

export const DATABASE_CLIENT = 'DATABASE_CLIENT';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private database: any = null;
  private ports: PersistencePorts | null = null;
  private unitOfWork: SqliteUnitOfWorkAdapter | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const dbPath =
      this.configService.get<string>('app.dbPath') || '.tmp/task-management.db';
    this.database = new Database(dbPath);
    this.database.pragma('foreign_keys = ON');
    this.ports = {
      authenticationPort: new JwtAuthenticationAdapter({
        secretOrPrivateKey: this.configService.get<string>(
          'app.jwtSecret'
        ) as any,
        issuer: this.configService.get<string>('app.jwtIssuer')!,
        audience: this.configService.get<string>('app.jwtAudience')!
      }),
      userPersistence: new NoOpUserPersistenceAdapter(),
      taskPersistence: new SqliteTaskPersistenceAdapter(this.database!),
      projectPersistence: new SqliteProjectPersistenceAdapter(this.database!),
      projectStatsPersistence: new SqliteProjectStatsPersistenceAdapter(
        this.database!
      ),
      generator: new NanoidGeneratorAdapter()
    };
    this.unitOfWork = new SqliteUnitOfWorkAdapter(this.database!);
    createConsoleLogger('DatabaseService').info('Database initialized', {
      dbPath
    });
  }

  onModuleDestroy(): void {
    this.database?.close();
  }

  getPersistencePorts(): PersistencePorts {
    if (!this.ports) throw new Error('Database not initialized');
    return this.ports;
  }

  getDatabaseAdapter(): SqliteUnitOfWorkAdapter {
    if (!this.unitOfWork) throw new Error('Database not initialized');
    return this.unitOfWork;
  }
}

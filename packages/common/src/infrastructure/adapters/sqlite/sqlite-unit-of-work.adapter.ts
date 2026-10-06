import type { UnitOfWorkPort } from '@hexagonal-ts-template/common/application';
import type { Database } from 'better-sqlite3';

export class SqliteUnitOfWorkAdapter implements UnitOfWorkPort<Database> {
  constructor(private readonly database: Database) {}

  withTransaction<T>(work: (transaction?: Database) => T): T {
    return this.database.transaction((transaction) => work(transaction)) as T;
  }
}

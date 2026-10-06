import type { UnitOfWorkPort } from '@hexagonal-ts-template/common/application';
import { DataSource, EntityManager } from 'typeorm';

export class TypeOrmUnitOfWorkAdapter implements UnitOfWorkPort<EntityManager> {
  constructor(private readonly dataSource: DataSource) {}

  async withTransaction<T>(
    work: (transaction: EntityManager) => Promise<T>
  ): Promise<T> {
    return this.dataSource.transaction(work);
  }
}

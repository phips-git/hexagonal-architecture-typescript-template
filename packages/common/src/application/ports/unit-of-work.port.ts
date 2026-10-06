export interface UnitOfWorkPort<TTx = unknown> {
  withTransaction<T>(
    work: (transaction?: TTx) => T | Promise<T>
  ): T | Promise<T>;
}

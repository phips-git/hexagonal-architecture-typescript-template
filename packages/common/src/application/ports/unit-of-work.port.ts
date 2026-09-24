export type TransactionContext<TTx = unknown> = TTx;

export interface UnitOfWorkPort<TTx = unknown> {
  withTransaction<T>(
    work: (tx: TransactionContext<TTx>) => Promise<T>
  ): Promise<T>;
}

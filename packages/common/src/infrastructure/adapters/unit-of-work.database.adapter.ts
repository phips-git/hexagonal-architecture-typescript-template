import type {
  TransactionContext,
  UnitOfWorkPort
} from '../../application/ports';

type TransactionalClient<TTransaction> = {
  transaction<T>(work: (tx: TTransaction) => Promise<T>): Promise<T>;
};

export class UnitOfWorkDatabaseAdapter<
  TTransaction
> implements UnitOfWorkPort<TTransaction> {
  constructor(
    private readonly databaseClient: TransactionalClient<TTransaction>
  ) {}

  async withTransaction<T>(
    work: (tx: TransactionContext<TTransaction>) => Promise<T>
  ): Promise<T> {
    return this.databaseClient.transaction(async (tx) => work(tx));
  }
}

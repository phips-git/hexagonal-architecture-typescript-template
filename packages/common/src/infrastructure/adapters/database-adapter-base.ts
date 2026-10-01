export abstract class DatabaseAdapterBase<
  TDatabaseClient = unknown,
  TTransaction = unknown
> {
  private readonly _databaseClient: TDatabaseClient;
  constructor(databaseClient: TDatabaseClient) {
    this._databaseClient = databaseClient;
  }

  protected databaseClient(
    tx: TTransaction | null | undefined
  ): TDatabaseClient | TTransaction {
    return tx ?? this._databaseClient;
  }
}

import type {
  TransactionContext,
  UnitOfWorkPort
} from '@hexagonal-ts-template/common/application';

export class InMemoryUnitOfWork implements UnitOfWorkPort<void> {
  private transactionActive = false;
  private operations: Array<() => Promise<void>> = [];

  async withTransaction<T>(
    work: (tx: TransactionContext<void>) => Promise<T>
  ): Promise<T> {
    this.transactionActive = true;
    this.operations = [];

    try {
      const result = await work(undefined);

      // Commit all operations
      for (const operation of this.operations) {
        await operation();
      }

      return result;
    } catch (error) {
      // Rollback
      this.operations = [];
      throw error;
    } finally {
      this.transactionActive = false;
    }
  }

  registerOperation(operation: () => Promise<void>): void {
    this.operations.push(operation);
  }

  get isActive(): boolean {
    return this.transactionActive;
  }
}

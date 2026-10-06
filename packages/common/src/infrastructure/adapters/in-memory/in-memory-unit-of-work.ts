import type { UnitOfWorkPort } from '@hexagonal-ts-template/common/application';

export class InMemoryUnitOfWork implements UnitOfWorkPort<void> {
  private transactionActive = false;
  private operations: Array<() => void> = [];

  withTransaction<T>(work: (transaction: void) => T): T {
    this.transactionActive = true;
    this.operations = [];

    try {
      const result = work();

      // Commit all operations
      for (const operation of this.operations) {
        operation();
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

  registerOperation(operation: () => void): void {
    this.operations.push(operation);
  }

  get isActive(): boolean {
    return this.transactionActive;
  }
}

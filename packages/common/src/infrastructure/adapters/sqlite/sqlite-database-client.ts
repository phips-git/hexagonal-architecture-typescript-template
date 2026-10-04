import sqlite3 from 'sqlite3';

const DB_PATH =
  process.env['TASK_MANAGEMENT_DB_PATH'] || '.tmp/task-management.db';

export class SqliteDatabaseClient {
  constructor(private readonly database: sqlite3.Database) {}

  static async create(): Promise<SqliteDatabaseClient> {
    const client = new SqliteDatabaseClient(new sqlite3.Database(DB_PATH));
    await client.initialize();
    return client;
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.database.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async transaction<T>(work: (tx: sqlite3.Database) => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.database.serialize(() => {
        this.database.run('BEGIN TRANSACTION', (err) => {
          if (err) {
            reject(err);
            return;
          }

          work(this.database)
            .then(async (result) => {
              this.database.run('COMMIT TRANSACTION', (commitErr) => {
                if (commitErr) {
                  this.database.run('ROLLBACK TRANSACTION', () => {
                    reject(commitErr);
                  });
                  return;
                }
                resolve(result);
              });
            })
            .catch(async (error) => {
              this.database.run('ROLLBACK TRANSACTION', (rollbackErr) => {
                if (rollbackErr) {
                  console.error('Failed to rollback transaction:', rollbackErr);
                }
                reject(error);
              });
            });
        });
      });
    });
  }

  getDatabase(): sqlite3.Database {
    return this.database;
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.database.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

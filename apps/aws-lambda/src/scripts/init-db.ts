import { initializeSchema } from '@hexagonal-ts-template/task-management/infrastructure';
import sqlite3 from 'sqlite3';

const DB_PATH = process.env['DB_PATH'] || '.tmp/task-management.db';

async function main() {
  console.log('Initializing database at:', DB_PATH);

  const db = new sqlite3.Database(DB_PATH);

  try {
    await new Promise<void>((resolve, reject) => {
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    await initializeSchema(db);

    console.log('✓ Database schema initialized successfully');
  } catch (error) {
    console.error('✗ Failed to initialize database:', error);
    process.exit(1);
  } finally {
    await new Promise<void>((resolve, reject) => {
      db.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

main();

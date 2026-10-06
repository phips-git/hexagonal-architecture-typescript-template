import { initializeSchema } from '@hexagonal-ts-template/task-management/infrastructure';
import Database from 'better-sqlite3';

const DB_PATH = process.env['DB_PATH'] || '.tmp/nestjs-task-management.db';

async function main() {
  console.log('Initializing database at:', DB_PATH);

  try {
    const database = new Database(DB_PATH);
    database.pragma('foreign_keys = ON');
    await initializeSchema(database);
    database.close();
    console.log('✓ Database schema initialized successfully');
  } catch (error) {
    console.error('✗ Failed to initialize database:', error);
    process.exit(1);
  }
}

main();

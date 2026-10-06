import { initializeSchema } from '@hexagonal-ts-template/task-management/infrastructure';
import Database from 'better-sqlite3';

const DB_PATH = process.env['DB_PATH'] || '.tmp/task-management.db';

function main() {
  console.log('Initializing database at:', DB_PATH);

  const db = new Database(DB_PATH);

  try {
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
    console.log('✓ Database schema initialized successfully');
  } catch (error) {
    console.error('✗ Failed to initialize database:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();

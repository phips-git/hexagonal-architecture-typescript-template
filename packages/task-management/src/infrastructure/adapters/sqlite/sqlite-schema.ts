import sqlite3 from 'sqlite3';

export function initializeSchema(database: sqlite3.Database): Promise<void> {
  return new Promise((resolve) => {
    database.serialize(() => {
      database.run(
        `CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`
      );
      database.run(
        `CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'PENDING',
          priority TEXT NOT NULL DEFAULT 'MEDIUM',
          assigned_to TEXT,
          due_date TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )`
      );
      database.run(
        `CREATE TABLE IF NOT EXISTS project_stats (
          project_id TEXT PRIMARY KEY,
          task_count INTEGER NOT NULL DEFAULT 0,
          last_activity_at TEXT NOT NULL,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )`
      );
      resolve();
    });
  });
}

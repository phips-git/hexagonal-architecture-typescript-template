import sqlite3 from 'sqlite3';
import type { ProjectId } from '../../../domain.export';
import type { ProjectStatsPersistencePort } from '../../../domain/ports';

export class SqliteProjectStatsPersistencePort implements ProjectStatsPersistencePort {
  constructor(private readonly databaseClient: sqlite3.Database) {}

  async incrementTaskCount(
    projectId: ProjectId,
    lastActivityAt: Date
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const activityAt = lastActivityAt.toISOString();
      this.databaseClient.run(
        'INSERT INTO project_stats (project_id, task_count, last_activity_at) VALUES (?, 1, ?) ON CONFLICT(project_id) DO UPDATE SET task_count = task_count + 1, last_activity_at = ?',
        [projectId, activityAt, activityAt],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  }

  async decrementTaskCount(
    projectId: ProjectId,
    lastActivityAt: Date
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.databaseClient.get(
        'SELECT task_count FROM project_stats WHERE project_id = ?',
        [projectId],
        (err, row: { task_count: number } | undefined) => {
          if (err) {
            reject(err);
            return;
          }
          if (!row) {
            resolve();
            return;
          }
          const newCount = Math.max(0, row.task_count - 1);
          this.databaseClient.run(
            'UPDATE project_stats SET task_count = ?, last_activity_at = ? WHERE project_id = ?',
            [newCount, lastActivityAt.toISOString(), projectId],
            function (err) {
              if (err) {
                reject(err);
                return;
              }
              resolve();
            }
          );
        }
      );
    });
  }
}

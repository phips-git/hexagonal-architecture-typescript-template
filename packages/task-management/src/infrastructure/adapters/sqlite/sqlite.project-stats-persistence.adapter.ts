import type { BetterSqlite3Database } from '@hexagonal-ts-template/common/infrastructure';
import type { ProjectId } from '../../../domain.export';
import type { ProjectStatsPersistencePort } from '../../../domain/ports';

export class SqliteProjectStatsPersistenceAdapter implements ProjectStatsPersistencePort {
  constructor(private readonly databaseClient: BetterSqlite3Database) {}

  async incrementTaskCount(
    projectId: ProjectId,
    lastActivityAt: Date
  ): Promise<void> {
    const activityAt = lastActivityAt.toISOString();
    await this.databaseClient.run(
      'INSERT INTO project_stats (project_id, task_count, last_activity_at) VALUES (?, 1, ?) ON CONFLICT(project_id) DO UPDATE SET task_count = task_count + 1, last_activity_at = ?',
      [projectId, activityAt, activityAt]
    );
  }

  async decrementTaskCount(
    projectId: ProjectId,
    lastActivityAt: Date
  ): Promise<void> {
    const row = await this.databaseClient.get(
      'SELECT task_count FROM project_stats WHERE project_id = ?',
      projectId
    );

    if (!row) {
      return;
    }

    const newCount = Math.max(0, row.task_count - 1);
    this.databaseClient.run(
      'UPDATE project_stats SET task_count = ?, last_activity_at = ? WHERE project_id = ?',
      [newCount, lastActivityAt.toISOString(), projectId]
    );
  }
}

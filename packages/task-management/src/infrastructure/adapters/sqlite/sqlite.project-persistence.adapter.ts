import {
  InternalServerError,
  NotFoundError
} from '@hexagonal-ts-template/common/domain';
import type { BetterSqlite3Database } from '@hexagonal-ts-template/common/infrastructure';
import type {
  Project,
  ProjectCreationRecord,
  ProjectId,
  ProjectReference,
  ProjectUpdateRecord
} from '../../../domain/models';
import type { ProjectPersistencePort } from '../../../domain/ports';

export class SqliteProjectPersistenceAdapter implements ProjectPersistencePort {
  constructor(private readonly databaseClient: BetterSqlite3Database) {}

  async create(creationRecord: ProjectCreationRecord): Promise<void> {
    await this.databaseClient.run(
      'INSERT INTO projects (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [
        creationRecord.id,
        creationRecord.name,
        creationRecord.description,
        creationRecord.createdAt.toISOString(),
        creationRecord.updatedAt.toISOString()
      ]
    );
  }

  async findReference(projectId: ProjectId): Promise<ProjectReference | null> {
    const row = await this.databaseClient.get(
      'SELECT id, name FROM projects WHERE id = ?',
      projectId
    );
    return row ? { id: row.id as ProjectId, name: row.name } : null;
  }

  async findById(projectId: ProjectId): Promise<Project | null> {
    const row = await this.databaseClient.get(
      'SELECT * FROM projects WHERE id = ?',
      projectId
    );
    return row
      ? {
          id: row.id as ProjectId,
          name: row.name,
          description: row.description,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        }
      : null;
  }

  async update(
    projectId: ProjectId,
    updateRecord: ProjectUpdateRecord
  ): Promise<void> {
    const updates: string[] = [];
    const values: unknown[] = [];
    const now = new Date().toISOString();

    if (updateRecord.name !== undefined) {
      updates.push('name = ?');
      values.push(updateRecord.name);
    }
    if (updateRecord.description !== undefined) {
      updates.push('description = ?');
      values.push(updateRecord.description);
    }
    if (updates.length === 0) {
      const result = await this.findById(projectId);
      if (!result) {
        throw new NotFoundError('Project not found');
      }
    }

    values.push(now, projectId);
    this.databaseClient.run(
      `UPDATE projects SET ${updates.join(', ')}, updated_at = ? WHERE id = ?`,
      values
    );
    const result = await this.findById(projectId);
    if (!result) {
      throw new InternalServerError('Project not found after update');
    }
  }

  async remove(projectId: ProjectId): Promise<void> {
    await this.databaseClient.run(
      'DELETE FROM projects WHERE id = ?',
      projectId
    );
  }
}

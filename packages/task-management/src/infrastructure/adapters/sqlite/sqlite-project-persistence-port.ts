import sqlite3 from 'sqlite3';
import type {
  Project,
  ProjectCreationRecord,
  ProjectId,
  ProjectReference,
  ProjectUpdateRecord
} from '../../../domain/models';
import type { ProjectPersistencePort } from '../../../domain/ports';

export class SqliteProjectPersistencePort implements ProjectPersistencePort {
  constructor(private readonly databaseClient: sqlite3.Database) {}

  async create(creationRecord: ProjectCreationRecord): Promise<Project> {
    return new Promise((resolve, reject) => {
      this.databaseClient.run(
        'INSERT INTO projects (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [
          creationRecord.id,
          creationRecord.name,
          creationRecord.description,
          creationRecord.createdAt,
          creationRecord.updatedAt
        ],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(creationRecord);
        }
      );
    });
  }

  async findReference(projectId: ProjectId): Promise<ProjectReference | null> {
    return new Promise((resolve, reject) => {
      this.databaseClient.get(
        'SELECT id, name FROM projects WHERE id = ?',
        [projectId],
        (err, row: { id: string; name: string } | undefined) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(row ? { id: row.id as ProjectId, name: row.name } : null);
        }
      );
    });
  }

  async findById(projectId: ProjectId): Promise<Project | null> {
    return new Promise((resolve, reject) => {
      this.databaseClient.get(
        'SELECT * FROM projects WHERE id = ?',
        [projectId],
        (err, row: any | undefined) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(
            row
              ? {
                  id: row.id as ProjectId,
                  name: row.name,
                  description: row.description,
                  createdAt: new Date(row.created_at),
                  updatedAt: new Date(row.updated_at)
                }
              : null
          );
        }
      );
    });
  }

  async update(
    projectId: ProjectId,
    updateRecord: ProjectUpdateRecord
  ): Promise<Project> {
    const updates: string[] = [];
    const values: any[] = [];
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
        throw new Error('Project not found');
      }
      return result;
    }

    values.push(now, projectId);
    const self = this;
    return new Promise((resolve, reject) => {
      this.databaseClient.run(
        `UPDATE projects SET ${updates.join(', ')}, updated_at = ? WHERE id = ?`,
        values,
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          if (this.changes === 0) {
            reject(new Error('Project not found'));
            return;
          }
          self
            .findById(projectId)
            .then((result) => {
              if (result) {
                resolve(result);
              } else {
                reject(new Error('Project not found after update'));
              }
            })
            .catch(reject);
        }
      );
    });
  }

  async remove(projectId: ProjectId): Promise<void> {
    return new Promise((resolve, reject) => {
      this.databaseClient.run(
        'DELETE FROM projects WHERE id = ?',
        [projectId],
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
}

import sqlite3 from 'sqlite3';
import type {
  ProjectId,
  Task,
  TaskCreationRecord,
  TaskId,
  TaskReference,
  TaskStatus,
  TaskUpdateRecord
} from '../../../domain/models';
import type { TaskPersistencePort } from '../../../domain/ports';

export class SqliteTaskPersistencePort implements TaskPersistencePort {
  constructor(private readonly databaseClient: sqlite3.Database) {}

  async create(creationProperties: TaskCreationRecord): Promise<Task> {
    return new Promise((resolve, reject) => {
      const createdAt = creationProperties.createdAt.toISOString();
      const updatedAt = creationProperties.updatedAt.toISOString();
      this.databaseClient.run(
        'INSERT INTO tasks (id, project_id, title, description, status, priority, assigned_to, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          creationProperties.id,
          creationProperties.projectId,
          creationProperties.title,
          creationProperties.description,
          creationProperties.status,
          creationProperties.priority,
          creationProperties.assignedTo,
          creationProperties.dueDate,
          createdAt,
          updatedAt
        ],
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(creationProperties);
        }
      );
    });
  }

  async findReference(
    projectId: ProjectId,
    taskId: TaskId
  ): Promise<TaskReference | null> {
    return new Promise((resolve, reject) => {
      this.databaseClient.get(
        'SELECT id, project_id, title FROM tasks WHERE id = ? AND project_id = ?',
        [taskId, projectId],
        (
          err,
          row:
            { id: TaskId; projectId: ProjectId; status: TaskStatus } | undefined
        ) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(
            row
              ? {
                  id: row.id,
                  projectId: row.projectId,
                  status: row.status
                }
              : null
          );
        }
      );
    });
  }

  async findById(projectId: ProjectId, taskId: TaskId): Promise<Task | null> {
    return new Promise((resolve, reject) => {
      this.databaseClient.get(
        'SELECT * FROM tasks WHERE id = ? AND project_id = ?',
        [taskId, projectId],
        (err, row: any | undefined) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(
            row
              ? {
                  id: row.id as TaskId,
                  projectId: row.project_id as ProjectId,
                  title: row.title,
                  description: row.description,
                  status: row.status,
                  priority: row.priority,
                  assignedTo: row.assigned_to,
                  dueDate: row.due_date ? new Date(row.due_date) : null,
                  createdAt: new Date(row.created_at),
                  updatedAt: new Date(row.updated_at)
                }
              : null
          );
        }
      );
    });
  }

  async findAllByProject(projectId: ProjectId): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.databaseClient.all(
        'SELECT id, project_id, title, status, priority, created_at FROM tasks WHERE project_id = ?',
        [projectId],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(
            rows.map((row: any) => ({
              id: row.id,
              projectId: row.project_id,
              title: row.title,
              status: row.status,
              priority: row.priority,
              createdAt: new Date(row.created_at)
            }))
          );
        }
      );
    });
  }

  async update(
    projectId: ProjectId,
    taskId: TaskId,
    updateRecord: TaskUpdateRecord
  ): Promise<Task> {
    const updates: string[] = [];
    const values: any[] = [];
    const now = new Date().toISOString();

    if (updateRecord.title !== undefined) {
      updates.push('title = ?');
      values.push(updateRecord.title);
    }
    if (updateRecord.description !== undefined) {
      updates.push('description = ?');
      values.push(updateRecord.description);
    }
    if (updateRecord.status !== undefined) {
      updates.push('status = ?');
      values.push(updateRecord.status);
    }
    if (updateRecord.priority !== undefined) {
      updates.push('priority = ?');
      values.push(updateRecord.priority);
    }
    if (updateRecord.assignedTo !== undefined) {
      updates.push('assigned_to = ?');
      values.push(updateRecord.assignedTo);
    }
    if (updateRecord.dueDate !== undefined) {
      updates.push('due_date = ?');
      values.push(
        updateRecord.dueDate
          ? new Date(updateRecord.dueDate).toISOString()
          : null
      );
    }

    if (updates.length === 0) {
      const result = await this.findById(projectId, taskId);
      if (!result) {
        throw new Error('Task not found');
      }
      return result;
    }

    values.push(now, taskId, projectId);
    const self = this;
    return new Promise((resolve, reject) => {
      this.databaseClient.run(
        `UPDATE tasks SET ${updates.join(', ')}, updated_at = ? WHERE id = ? AND project_id = ?`,
        values,
        function (err) {
          if (err) {
            reject(err);
            return;
          }
          if (this.changes === 0) {
            reject(new Error('Task not found'));
            return;
          }
          self
            .findById(projectId, taskId)
            .then((result) => {
              if (result) {
                resolve(result);
              } else {
                reject(new Error('Task not found after update'));
              }
            })
            .catch(reject);
        }
      );
    });
  }

  async remove(projectId: ProjectId, taskId: TaskId): Promise<void> {
    return new Promise((resolve, reject) => {
      this.databaseClient.run(
        'DELETE FROM tasks WHERE id = ? AND project_id = ?',
        [taskId, projectId],
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

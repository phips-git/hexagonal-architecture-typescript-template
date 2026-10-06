import {
  InternalServerError,
  NotFoundError
} from '@hexagonal-ts-template/common/domain';
import type { BetterSqlite3Database } from '@hexagonal-ts-template/common/infrastructure';
import type {
  ProjectId,
  Task,
  TaskCreationRecord,
  TaskId,
  TaskListItem,
  TaskReference,
  TaskUpdateRecord
} from '../../../domain/models';
import type { TaskPersistencePort } from '../../../domain/ports';

export class SqliteTaskPersistenceAdapter implements TaskPersistencePort {
  constructor(private readonly databaseClient: BetterSqlite3Database) {}

  async create(creationProperties: TaskCreationRecord): Promise<void> {
    await this.databaseClient.run(
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
        creationProperties.createdAt.toISOString(),
        creationProperties.updatedAt.toISOString()
      ]
    );
  }

  async findReference(
    projectId: ProjectId,
    taskId: TaskId
  ): Promise<TaskReference | null> {
    const row = await this.databaseClient.get(
      'SELECT id, project_id, title, status FROM tasks WHERE id = ? AND project_id = ?',
      [taskId, projectId]
    );
    return row
      ? {
          id: row.id as TaskId,
          projectId: row.project_id as ProjectId,
          status: row.status
        }
      : null;
  }

  async findById(projectId: ProjectId, taskId: TaskId): Promise<Task | null> {
    const row = await this.databaseClient.get(
      'SELECT * FROM tasks WHERE id = ? AND project_id = ?',
      [taskId, projectId]
    );
    return row
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
      : null;
  }

  async findAllByProject(projectId: ProjectId): Promise<TaskListItem[]> {
    const rows = await this.databaseClient.all(
      'SELECT id, project_id, title, status, priority, created_at FROM tasks WHERE project_id = ?',
      projectId
    );
    return rows.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      title: row.title,
      status: row.status,
      priority: row.priority,
      createdAt: new Date(row.created_at)
    }));
  }

  async update(
    projectId: ProjectId,
    taskId: TaskId,
    updateRecord: TaskUpdateRecord
  ): Promise<void> {
    const updates: string[] = [];
    const values: unknown[] = [];
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
        throw new NotFoundError('Task not found');
      }
    }

    values.push(now, taskId, projectId);
    this.databaseClient.run(
      `UPDATE tasks SET ${updates.join(', ')}, updated_at = ? WHERE id = ? AND project_id = ?`,
      values
    );
    const result = await this.findById(projectId, taskId);
    if (!result) {
      throw new InternalServerError('Task not found after update');
    }
  }

  async remove(projectId: ProjectId, taskId: TaskId): Promise<void> {
    await this.databaseClient.run(
      'DELETE FROM tasks WHERE id = ? AND project_id = ?',
      [taskId, projectId]
    );
  }
}

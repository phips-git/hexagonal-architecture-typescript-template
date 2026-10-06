import { NotFoundError } from '@hexagonal-ts-template/common/domain';
import { Repository } from 'typeorm';
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
import type { TaskEntity } from './entities/task.entity';

export class TypeOrmTaskPersistencePort implements TaskPersistencePort {
  constructor(private readonly taskRepository: Repository<TaskEntity>) {}

  async create(creationProperties: TaskCreationRecord): Promise<void> {
    const taskEntity = this.taskRepository.create({
      projectId: creationProperties.projectId,
      title: creationProperties.title,
      description: creationProperties.description,
      status: creationProperties.status,
      priority: creationProperties.priority,
      assignedTo: creationProperties.assignedTo,
      dueDate: creationProperties.dueDate,
      createdAt: creationProperties.createdAt,
      updatedAt: creationProperties.updatedAt
    });

    await this.taskRepository.save(taskEntity);
  }

  async findReference(
    projectId: ProjectId,
    taskId: TaskId
  ): Promise<TaskReference | null> {
    const task = await this.taskRepository.findOne({
      select: { id: true, projectId: true, status: true },
      where: { id: taskId, projectId: projectId }
    });

    if (!task) {
      return null;
    }

    return {
      id: task.id as TaskId,
      projectId: task.projectId as ProjectId,
      status: task.status as TaskStatus
    };
  }

  async findById(projectId: ProjectId, taskId: TaskId): Promise<Task | null> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId: projectId }
    });

    if (!task) {
      return null;
    }

    return task.toDomain();
  }

  async findAllByProject(projectId: ProjectId): Promise<Task[]> {
    const tasks = await this.taskRepository.find({
      where: { projectId: projectId },
      select: {
        id: true,
        projectId: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true
      }
    });

    return tasks.map((task) => task.toDomain());
  }

  async update(
    projectId: ProjectId,
    taskId: TaskId,
    updateRecord: TaskUpdateRecord
  ): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId: projectId }
    });

    if (!task) {
      throw new Error('Task not found');
    }

    if (updateRecord.title !== undefined) {
      task.title = updateRecord.title;
    }

    if (updateRecord.description !== undefined) {
      task.description = updateRecord.description;
    }

    if (updateRecord.status !== undefined) {
      task.status = updateRecord.status;
    }

    if (updateRecord.priority !== undefined) {
      task.priority = updateRecord.priority;
    }

    if (updateRecord.assignedTo !== undefined) {
      task.assignedTo = updateRecord.assignedTo;
    }

    if (updateRecord.dueDate !== undefined) {
      task.dueDate = updateRecord.dueDate;
    }

    task.updatedAt = new Date();
    await this.taskRepository.save(task);
  }

  async remove(projectId: ProjectId, taskId: TaskId): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, projectId: projectId }
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    await this.taskRepository.remove(task);
  }
}

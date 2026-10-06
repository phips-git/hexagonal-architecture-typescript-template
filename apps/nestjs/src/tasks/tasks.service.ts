import {
  CreateTaskUsecase,
  DeleteTaskUsecase,
  UpdateTaskUsecase
} from '@hexagonal-ts-template/task-management/application';
import { Injectable } from '@nestjs/common';
import { CreateTaskDto, UpdateTaskDto } from './dtos/create-task.dto';

export interface AuthorizationContext {
  userId: string;
  userEmail: string;
  userRole: string;
}

@Injectable()
export class TasksService {
  constructor(
    private readonly databaseService: import('../infrastructure/database.service').DatabaseService
  ) {}

  async createTask(
    dto: CreateTaskDto,
    projectId: string,
    authorizationContext: AuthorizationContext
  ): Promise<{ taskId: string }> {
    const persistencePorts = this.databaseService.getPersistencePorts();
    const usecase = new CreateTaskUsecase(
      {
        generateId: () => `id_${Date.now()}`,
        loggerFactory: () =>
          import('@hexagonal-ts-template/common/infrastructure').then((mod) =>
            mod.createConsoleLogger('TasksService')
          )
      },
      persistencePorts.taskPersistence,
      persistencePorts.projectPersistence,
      persistencePorts.projectStatsPersistence,
      persistencePorts
    );
    const output = await usecase.execute({
      authorizationContext,
      projectId: projectId as any,
      creationProperties: {
        title: dto.title,
        description: dto.description ?? null,
        priority: dto.priority ?? 'medium',
        assignedTo: dto.assignedTo ?? null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null
      }
    });
    return { taskId: output.taskId };
  }

  async updateTask(
    taskId: string,
    projectId: string,
    dto: UpdateTaskDto,
    authorizationContext: AuthorizationContext
  ): Promise<{ taskId: string }> {
    const persistencePorts = this.databaseService.getPersistencePorts();
    const usecase = new UpdateTaskUsecase(
      {
        generateId: () => `id_${Date.now()}`,
        loggerFactory: () =>
          import('@hexagonal-ts-template/common/infrastructure').then((mod) =>
            mod.createConsoleLogger('TasksService')
          )
      },
      persistencePorts.taskPersistence
    );
    const output = await usecase.execute({
      authorizationContext,
      projectId: projectId as any,
      taskId: taskId as any,
      updateProperties: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        assignedTo: dto.assignedTo,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null
      }
    });
    return { taskId: output.taskId };
  }

  async deleteTask(
    taskId: string,
    projectId: string,
    authorizationContext: AuthorizationContext
  ): Promise<void> {
    const persistencePorts = this.databaseService.getPersistencePorts();
    const usecase = new DeleteTaskUsecase(
      {
        generateId: () => `id_${Date.now()}`,
        loggerFactory: () =>
          import('@hexagonal-ts-template/common/infrastructure').then((mod) =>
            mod.createConsoleLogger('TasksService')
          )
      },
      persistencePorts.taskPersistence,
      persistencePorts,
      persistencePorts.projectStatsPersistence
    );
    await usecase.execute({
      authorizationContext,
      projectId: projectId as any,
      taskId: taskId as any
    });
  }

  async getTask(projectId: string, taskId: string): Promise<any> {
    const persistencePorts = this.databaseService.getPersistencePorts();
    return await persistencePorts.taskPersistence.findById(
      taskId,
      projectId as any
    );
  }

  async getTasksForProject(projectId: string): Promise<any[]> {
    const persistencePorts = this.databaseService.getPersistencePorts();
    return await persistencePorts.taskPersistence.findAllByProject(
      projectId as any
    );
  }
}

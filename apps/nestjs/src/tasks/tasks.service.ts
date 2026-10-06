import type { UsecaseExecutionDependencies } from '@hexagonal-ts-template/common/application';
import {
  CreateTaskUsecase,
  DeleteTaskUsecase,
  UpdateTaskUsecase
} from '@hexagonal-ts-template/task-management/application';
import type {
  ProjectId,
  TaskManagementAuthorizationContext,
  TenantId
} from '@hexagonal-ts-template/task-management/domain';
import { Injectable } from '@nestjs/common';
import { CreateTaskDto, UpdateTaskDto } from './dtos/create-task.dto';

export interface AuthorizationContext {
  readonly tenantId: string;
  readonly projectId: string;
  readonly role: string;
}

@Injectable()
export class TasksService {
  constructor(
    private readonly databaseService: import('../infrastructure/database.service').DatabaseService
  ) {}

  private getUsecaseDependencies(): UsecaseExecutionDependencies {
    return {
      generateId: () =>
        this.databaseService.getPersistencePorts().generator.generate(),
      loggerFactory: (name: string) => {
        const mod = require('@hexagonal-ts-template/common/infrastructure');
        return mod.createConsoleLogger(name);
      }
    };
  }

  async createTask(
    dto: CreateTaskDto,
    projectId: string,
    authorizationContext: AuthorizationContext
  ): Promise<{ taskId: string }> {
    const persistencePorts = this.databaseService.getPersistencePorts();
    const usecase = this.getCreateTaskUsecase(persistencePorts);
    const output = await usecase.execute({
      authorizationContext:
        this.mapToTaskManagementAuthContext(authorizationContext),
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
    const usecase = this.getUpdateTaskUsecase(persistencePorts);
    const output = await usecase.execute({
      authorizationContext:
        this.mapToTaskManagementAuthContext(authorizationContext),
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
    const usecase = this.getDeleteTaskUsecase(persistencePorts);
    await usecase.execute({
      authorizationContext:
        this.mapToTaskManagementAuthContext(authorizationContext),
      projectId: projectId as any,
      taskId: taskId as any
    });
  }

  async getTask(projectId: string, taskId: string): Promise<any> {
    const persistencePorts = this.databaseService.getPersistencePorts();
    return await persistencePorts.taskPersistence.findById(
      projectId as any,
      taskId as any
    );
  }

  async getTasksForProject(projectId: string): Promise<any[]> {
    const persistencePorts = this.databaseService.getPersistencePorts();
    return await persistencePorts.taskPersistence.findAllByProject(
      projectId as any
    );
  }

  private getCreateTaskUsecase(
    persistencePorts: import('../infrastructure/database.service').PersistencePorts
  ): CreateTaskUsecase {
    return new CreateTaskUsecase(
      this.getUsecaseDependencies(),
      persistencePorts.projectPersistence as any,
      persistencePorts as any,
      persistencePorts.taskPersistence,
      persistencePorts.projectStatsPersistence
    );
  }

  private getUpdateTaskUsecase(
    persistencePorts: import('../infrastructure/database.service').PersistencePorts
  ): UpdateTaskUsecase {
    return new UpdateTaskUsecase(
      this.getUsecaseDependencies(),
      persistencePorts.taskPersistence
    );
  }

  private getDeleteTaskUsecase(
    persistencePorts: import('../infrastructure/database.service').PersistencePorts
  ): DeleteTaskUsecase {
    return new DeleteTaskUsecase(
      this.getUsecaseDependencies(),
      persistencePorts.taskPersistence,
      persistencePorts as any,
      persistencePorts.projectStatsPersistence
    );
  }

  private mapToTaskManagementAuthContext(
    context: AuthorizationContext
  ): TaskManagementAuthorizationContext {
    return {
      tenantId: context.tenantId as TenantId,
      projectId: context.projectId as ProjectId,
      role: context.role as any
    };
  }
}

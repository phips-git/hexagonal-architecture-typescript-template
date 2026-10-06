import type { UsecaseExecutionDependencies } from '@hexagonal-ts-template/common/application';
import {
  CreateProjectUsecase,
  DeleteProjectUsecase,
  UpdateProjectUsecase
} from '@hexagonal-ts-template/task-management/application';
import type {
  ProjectId,
  TaskManagementAuthorizationContext
} from '@hexagonal-ts-template/task-management/domain';
import { Injectable } from '@nestjs/common';
import { CreateProjectDto, UpdateProjectDto } from './dtos/create-project.dto';

export interface AuthorizationContext {
  readonly tenantId: string;
  readonly projectId: ProjectId | null;
  readonly role: string;
}

@Injectable()
export class ProjectsService {
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

  async createProject(
    dto: CreateProjectDto,
    authorizationContext: AuthorizationContext
  ): Promise<{ projectId: string }> {
    const persistencePorts = this.databaseService.getPersistencePorts();
    const usecase = this.getCreateProjectUsecase(persistencePorts);
    const output = await usecase.execute({
      authorizationContext:
        this.mapToTaskManagementAuthContext(authorizationContext),
      creationProperties: {
        name: dto.name,
        description: dto.description ?? null
      }
    });
    return { projectId: output.projectId };
  }

  async updateProject(
    id: string,
    dto: UpdateProjectDto,
    authorizationContext: AuthorizationContext
  ): Promise<{ projectId: string }> {
    const persistencePorts = this.databaseService.getPersistencePorts();
    const usecase = this.getUpdateProjectUsecase(persistencePorts);
    const output = await usecase.execute({
      authorizationContext:
        this.mapToTaskManagementAuthContext(authorizationContext),
      projectId: id as ProjectId,
      updateProperties: {
        name: dto.name,
        description: dto.description
      }
    });
    return { projectId: output.projectId };
  }

  async deleteProject(
    id: string,
    authorizationContext: AuthorizationContext
  ): Promise<void> {
    const persistencePorts = this.databaseService.getPersistencePorts();
    const usecase = this.getDeleteProjectUsecase(persistencePorts);
    await usecase.execute({
      authorizationContext:
        this.mapToTaskManagementAuthContext(authorizationContext),
      projectId: id as ProjectId
    });
  }

  private getCreateProjectUsecase(
    persistencePorts: import('../infrastructure/database.service').PersistencePorts
  ): CreateProjectUsecase {
    return new CreateProjectUsecase(
      this.getUsecaseDependencies(),
      persistencePorts.projectPersistence
    );
  }

  private getUpdateProjectUsecase(
    persistencePorts: import('../infrastructure/database.service').PersistencePorts
  ): UpdateProjectUsecase {
    return new UpdateProjectUsecase(
      this.getUsecaseDependencies(),
      persistencePorts.projectPersistence
    );
  }

  private getDeleteProjectUsecase(
    persistencePorts: import('../infrastructure/database.service').PersistencePorts
  ): DeleteProjectUsecase {
    return new DeleteProjectUsecase(
      this.getUsecaseDependencies(),
      persistencePorts.projectPersistence
    );
  }

  private mapToTaskManagementAuthContext(
    context: AuthorizationContext
  ): TaskManagementAuthorizationContext {
    return {
      tenantId: context.tenantId as any,
      projectId: context.projectId,
      role: context.role as any
    };
  }
}

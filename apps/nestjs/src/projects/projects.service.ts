import {
  CreateProjectUsecase,
  DeleteProjectUsecase,
  UpdateProjectUsecase
} from '@hexagonal-ts-template/task-management/application';
import { Injectable } from '@nestjs/common';
import { CreateProjectDto, UpdateProjectDto } from './dtos/create-project.dto';

export interface AuthorizationContext {
  userId: string;
  userEmail: string;
  userRole: string;
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly databaseService: import('../infrastructure/database.service').DatabaseService
  ) {}

  async createProject(
    dto: CreateProjectDto,
    authorizationContext: AuthorizationContext
  ): Promise<{ projectId: string }> {
    const persistencePorts = this.databaseService.getPersistencePorts();
    const usecase = new CreateProjectUsecase(
      {
        generateId: () => `id_${Date.now()}`,
        loggerFactory: () =>
          import('@hexagonal-ts-template/common/infrastructure').then((mod) =>
            mod.createConsoleLogger('ProjectsService')
          )
      },
      persistencePorts.projectPersistence
    );
    const output = await usecase.execute({
      authorizationContext,
      creationProperties: {
        name: dto.name,
        description: dto.description ?? null
      } as const
    });
    return { projectId: output.projectId };
  }

  async updateProject(
    id: string,
    dto: UpdateProjectDto,
    authorizationContext: AuthorizationContext
  ): Promise<{ projectId: string }> {
    const persistencePorts = this.databaseService.getPersistencePorts();
    const usecase = new UpdateProjectUsecase(
      {
        generateId: () => `id_${Date.now()}`,
        loggerFactory: () =>
          import('@hexagonal-ts-template/common/infrastructure').then((mod) =>
            mod.createConsoleLogger('ProjectsService')
          )
      },
      persistencePorts.projectPersistence
    );
    const output = await usecase.execute({
      authorizationContext,
      projectId: id as any,
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
    const usecase = new DeleteProjectUsecase(
      {
        generateId: () => `id_${Date.now()}`,
        loggerFactory: () =>
          import('@hexagonal-ts-template/common/infrastructure').then((mod) =>
            mod.createConsoleLogger('ProjectsService')
          )
      },
      persistencePorts.projectPersistence
    );
    await usecase.execute({ authorizationContext, projectId: id as any });
  }
}

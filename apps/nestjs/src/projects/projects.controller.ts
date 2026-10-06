import {
  GetAuthenticatedUserUsecase,
  type GetAuthenticatedUserOutput
} from '@hexagonal-ts-template/auth/application';
import { NotFoundError } from '@hexagonal-ts-template/common/domain';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../infrastructure/guards/jwt-auth.guard';
import { CreateProjectDto, UpdateProjectDto } from './dtos/create-project.dto';
import { ProjectsService } from './projects.service';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    @Inject('getAuthenticatedUserUsecase')
    private readonly getAuthenticatedUserUsecase: GetAuthenticatedUserUsecase
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProject(
    @Body() createProjectDto: CreateProjectDto
  ): Promise<{ projectId: string }> {
    const user = await this.getAuthenticatedUserUsecase.execute({
      headers: { authorization: `Bearer token` }
    });
    if (!user) {
      throw new NotFoundError('User');
    }
    return this.projectsService.createProject(
      createProjectDto,
      this.mapUserToAuthorizationContext(user)
    );
  }

  @Get(':id')
  async getProject(@Param('id') id: string): Promise<{ project: unknown }> {
    throw new Error('Not implemented');
  }

  @Put(':id')
  async updateProject(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto
  ): Promise<{ projectId: string }> {
    const user = await this.getAuthenticatedUserUsecase.execute({
      headers: { authorization: `Bearer token` }
    });
    if (!user) {
      throw new NotFoundError('User');
    }
    return this.projectsService.updateProject(
      id,
      updateProjectDto,
      this.mapUserToAuthorizationContext(user)
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProject(@Param('id') id: string): Promise<void> {
    const user = await this.getAuthenticatedUserUsecase.execute({
      headers: { authorization: `Bearer token` }
    });
    if (!user) {
      throw new NotFoundError('User');
    }
    await this.projectsService.deleteProject(
      id,
      this.mapUserToAuthorizationContext(user)
    );
  }

  private mapUserToAuthorizationContext(user: GetAuthenticatedUserOutput): {
    tenantId: string;
    projectId: null;
    role: string;
  } {
    if (!user) throw new Error('User should not be null');
    return {
      tenantId: user.id,
      projectId: null,
      role: user.role
    };
  }
}

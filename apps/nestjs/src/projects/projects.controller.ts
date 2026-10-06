import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Post, Put, UseGuards } from '@nestjs/common';
import { GetAuthenticatedUserUsecase } from '@hexagonal-ts-template/auth/application';
import { JwtAuthGuard } from '../infrastructure/guards/jwt-auth.guard';
import { CreateProjectDto, UpdateProjectDto } from './dtos/create-project.dto';
import { ProjectsService } from './projects.service';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    @Inject('getAuthenticatedUserUsecase')
    private readonly getAuthenticatedUserUsecase: GetAuthenticatedUserUsecase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<{ projectId: string }> {
    const user = await this.getAuthenticatedUserUsecase.execute({ headers: { authorization: `Bearer token` } });
    if (!user) throw new Error('Unauthorized');
    return this.projectsService.createProject(
      createProjectDto,
      { userId: user.id, userEmail: user.email, userRole: user.role },
    );
  }

  @Get(':id')
  async getProject(@Param('id') id: string): Promise<{ project: import('@hexagonal-ts-template/task-management/domain').Project }> {
    throw new Error('Not implemented');
  }

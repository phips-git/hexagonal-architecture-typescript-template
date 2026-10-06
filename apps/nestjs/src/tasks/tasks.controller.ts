import {
  GetAuthenticatedUserUsecase,
  type GetAuthenticatedUserOutput
} from '@hexagonal-ts-template/auth/application';
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
import { CreateTaskDto, UpdateTaskDto } from './dtos/create-task.dto';
import { TasksService } from './tasks.service';

@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    @Inject('getAuthenticatedUserUsecase')
    private readonly getAuthenticatedUserUsecase: GetAuthenticatedUserUsecase
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTask(
    @Param('projectId') projectId: string,
    @Body() createTaskDto: CreateTaskDto
  ): Promise<{ taskId: string }> {
    const user = await this.getAuthenticatedUserUsecase.execute({
      headers: { authorization: `Bearer token` }
    });
    if (!user) throw new Error('Unauthorized');
    return this.tasksService.createTask(
      createTaskDto,
      projectId,
      this.mapUserToAuthContext(user)
    );
  }

  @Get(':taskId')
  async getTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string
  ): Promise<{ task: unknown }> {
    throw new Error('Not implemented');
  }

  @Get()
  async listTasks(
    @Param('projectId') projectId: string
  ): Promise<{ tasks: unknown[] }> {
    throw new Error('Not implemented');
  }

  @Put(':taskId')
  async updateTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto
  ): Promise<{ taskId: string }> {
    throw new Error('Not implemented');
  }

  @Delete(':taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTask(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string
  ): Promise<void> {
    throw new Error('Not implemented');
  }

  private mapUserToAuthContext(user: GetAuthenticatedUserOutput) {
    if (!user) throw new Error('User should not be null');
    return {
      tenantId: user.id,
      projectId: '',
      role: user.role
    };
  }
}

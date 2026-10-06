import type {
  Project,
  Task,
  TaskListItem
} from '@hexagonal-ts-template/task-management/domain';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OutputMappingService {
  mapTaskToResponse(task: Task): Task {
    return {
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };
  }

  mapTaskListToResponse(tasks: Task[]): TaskListItem[] {
    return tasks.map((task) => ({
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      status: task.status,
      priority: task.priority,
      createdAt: task.createdAt
    }));
  }

  mapProjectToResponse(project: Project): Project {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  }
}

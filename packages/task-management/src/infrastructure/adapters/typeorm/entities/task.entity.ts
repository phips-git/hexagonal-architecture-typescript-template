import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm';
import {
  TaskPriority,
  TaskStatus,
  type ProjectId,
  type Task,
  type TaskId
} from '../../../../domain/models';
import { ProjectEntity } from './project.entity';

@Entity('tasks')
export class TaskEntity {
  @PrimaryColumn()
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  projectId!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 50 })
  status!: string;

  @Column({ type: 'varchar', length: 20 })
  priority!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  assignedTo?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => ProjectEntity, (project) => project.tasks, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'project_id' })
  project!: ProjectEntity;

  toDomain(): Task {
    return {
      id: this.id as TaskId,
      projectId: this.projectId as ProjectId,
      title: this.title,
      description: this.description ?? null,
      status: this.status as TaskStatus,
      priority: this.priority as TaskPriority,
      assignedTo: this.assignedTo ?? null,
      dueDate: this.dueDate ?? null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

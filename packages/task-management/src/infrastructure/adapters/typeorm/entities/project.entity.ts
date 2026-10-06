import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm';
import type { Project, ProjectId } from '../../../../domain/models';
import { TaskEntity } from './task.entity';

@Entity('projects')
export class ProjectEntity {
  @PrimaryColumn()
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => TaskEntity, (task) => task.project)
  tasks!: TaskEntity[];

  toDomain(): Project {
    return {
      id: this.id as ProjectId,
      name: this.name,
      description: this.description ?? null,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

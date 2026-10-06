import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('project_stats')
export class ProjectStatsEntity {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  projectId!: string;

  @Column({ type: 'int', default: 0 })
  taskCount!: number;

  @UpdateDateColumn({ type: 'timestamp' })
  lastActivityAt!: Date;

  toDomain(): {
    projectId: string;
    taskCount: number;
    lastActivityAt: Date;
  } {
    return {
      projectId: this.projectId,
      taskCount: this.taskCount,
      lastActivityAt: this.lastActivityAt
    };
  }
}

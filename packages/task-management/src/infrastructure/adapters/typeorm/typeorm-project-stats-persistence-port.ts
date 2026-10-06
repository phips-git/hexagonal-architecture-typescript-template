import { Repository } from 'typeorm';
import type { ProjectId } from '../../../domain/models';
import type { ProjectStatsPersistencePort } from '../../../domain/ports';
import type { ProjectStatsEntity } from './entities/project-stats.entity';

export class TypeOrmProjectStatsPersistencePort implements ProjectStatsPersistencePort {
  constructor(
    private readonly projectStatsRepository: Repository<ProjectStatsEntity>
  ) {}

  async incrementTaskCount(
    projectId: ProjectId,
    lastActivityAt: Date
  ): Promise<void> {
    let stats = await this.projectStatsRepository.findOne({
      where: { projectId: projectId }
    });

    if (stats) {
      stats.taskCount += 1;
      stats.lastActivityAt = lastActivityAt;
      await this.projectStatsRepository.save(stats);
    } else {
      const newStats = this.projectStatsRepository.create({
        projectId: projectId,
        taskCount: 1,
        lastActivityAt: lastActivityAt
      });
      await this.projectStatsRepository.save(newStats);
    }
  }

  async decrementTaskCount(
    projectId: ProjectId,
    lastActivityAt: Date
  ): Promise<void> {
    const stats = await this.projectStatsRepository.findOne({
      where: { projectId: projectId }
    });

    if (!stats) {
      return;
    }

    const newCount = Math.max(0, stats.taskCount - 1);
    stats.taskCount = newCount;
    stats.lastActivityAt = lastActivityAt;
    await this.projectStatsRepository.save(stats);
  }
}

import type { ProjectId } from '../models';

export interface ProjectStatsPersistencePort {
  incrementTaskCount(projectId: ProjectId, lastActivityAt: Date): Promise<void>;

  decrementTaskCount(projectId: ProjectId, lastActivityAt: Date): Promise<void>;
}

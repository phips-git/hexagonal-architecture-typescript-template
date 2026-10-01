export interface ProjectStatsPersistencePort {
  incrementTaskCount(projectId: string, lastActivityAt: Date): Promise<void>;

  decrementTaskCount(projectId: string, lastActivityAt: Date): Promise<void>;
}

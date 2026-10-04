import type {
  Project,
  ProjectCreationRecord,
  ProjectId,
  ProjectReference,
  ProjectUpdateRecord
} from '../models';

export interface ProjectPersistencePort {
  create(creationRecord: ProjectCreationRecord): Promise<Project>;

  findReference(projectId: ProjectId): Promise<ProjectReference | null>;

  findById(projectId: ProjectId): Promise<Project | null>;

  update(
    projectId: ProjectId,
    updateRecord: ProjectUpdateRecord
  ): Promise<Project>;

  remove(projectId: ProjectId): Promise<void>;
}

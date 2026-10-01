import type {
  Project,
  ProjectCreationProperties,
  ProjectReference,
  ProjectUpdateProperties
} from '../models';

export interface ProjectPersistencePort {
  create(creationProperties: ProjectCreationProperties): Promise<Project>;

  findReference(projectId: string): Promise<ProjectReference | null>;

  findById(projectId: string): Promise<Project | null>;

  update(
    projectId: string,
    updateProperties: ProjectUpdateProperties
  ): Promise<Project>;

  remove(projectId: string): Promise<boolean>;
}

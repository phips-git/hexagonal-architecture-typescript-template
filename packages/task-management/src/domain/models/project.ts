import type { Brand } from '@hexagonal-ts-template/common/domain';

export type ProjectId = Brand<string, 'ProjectId'>;

export interface ProjectReference {
  readonly id: ProjectId;
  readonly name: string;
}

export interface Project extends ProjectReference {
  readonly description: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type ProjectCreationProperties = Pick<Project, 'name' | 'description'>;

export interface ProjectCreationRecord
  extends ProjectReference, ProjectCreationProperties {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type ProjectUpdateProperties = Partial<
  Pick<Project, 'name' | 'description'>
>;

export interface ProjectUpdateRecord extends ProjectUpdateProperties {
  readonly updatedAt: string;
}

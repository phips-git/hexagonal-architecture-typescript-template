import type {
  ProjectCreationProperties,
  ProjectCreationRecord,
  ProjectId,
  ProjectUpdateProperties,
  ProjectUpdateRecord
} from '../../domain/models';

export function assembleProjectCreationRecord(
  id: ProjectId,
  creationProperties: Readonly<ProjectCreationProperties>
): Readonly<ProjectCreationRecord> {
  const now = new Date();

  return {
    ...creationProperties,
    id,
    createdAt: now,
    updatedAt: now
  };
}

export function assembleProjectUpdateRecord(
  updateProperties: Readonly<ProjectUpdateProperties>
): Readonly<ProjectUpdateRecord> {
  const now = new Date().toISOString();

  return {
    ...updateProperties,
    updatedAt: now
  };
}

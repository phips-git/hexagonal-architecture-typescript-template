import { ValidationError } from '@hexagonal-ts-template/common/domain';
import type {
  ProjectCreationProperties,
  ProjectUpdateProperties
} from '../models';

export function validateProjectCreationProperties({
  name,
  description
}: Readonly<ProjectCreationProperties>): void {
  validateProjectName(name);

  if (description) {
    validateProjectDescription(description);
  }
}

export function validateProjectUpdateProperties({
  name,
  description
}: Readonly<ProjectUpdateProperties>): void {
  if (name !== undefined) {
    validateProjectName(name);
  }

  if (description) {
    validateProjectDescription(description);
  }
}

function validateProjectName(name: string): string {
  if (!name || name.trim().length === 0) {
    throw new ValidationError('Project name cannot be empty');
  }

  if (name.length > 100) {
    throw new ValidationError('Project name must be less than 100 characters');
  }

  return name.trim();
}

function validateProjectDescription(description: string): string {
  if (description.length > 500) {
    throw new ValidationError(
      'Project description must be less than 500 characters'
    );
  }

  return description.trim();
}

export function validateProjectId(id: string): string {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new ValidationError('Invalid projectId format');
  }

  return id;
}

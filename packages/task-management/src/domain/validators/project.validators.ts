import { ValidationError } from '@hexagonal-ts-template/common/domain';
import type {
  ProjectCreationProperties,
  ProjectId,
  ProjectUpdateProperties,
  ValidProjectCreationProperties,
  ValidProjectUpdateProperties
} from '../models';

export function validateProjectId(
  projectId: string
): asserts projectId is ProjectId {
  if (typeof projectId !== 'string') {
    throw new ValidationError('Project id must be a string', {
      context: { projectId }
    });
  }

  if (projectId.length === 0) {
    throw new ValidationError('Project id must not be empty', {
      context: { projectId }
    });
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId)) {
    throw new ValidationError('Invalid project id format', {
      context: { projectId }
    });
  }
}

export function validateProjectCreationProperties(
  creationProperties: Readonly<ProjectCreationProperties>
): asserts creationProperties is ValidProjectCreationProperties {
  validateProjectName(creationProperties.name);

  if (creationProperties.description !== undefined) {
    validateProjectDescription(creationProperties.description);
  }
}

export function validateProjectUpdateProperties(
  updateProperties: ProjectUpdateProperties
): asserts updateProperties is ValidProjectUpdateProperties {
  if (updateProperties.name !== undefined) {
    validateProjectName(updateProperties.name);
  }

  if (updateProperties.description !== undefined) {
    validateProjectDescription(updateProperties.description);
  }
}

function validateProjectName(
  projectName: string
): asserts projectName is string {
  if (typeof projectName !== 'string') {
    throw new ValidationError('Project name must be a string', {
      context: { projectName }
    });
  }

  if (projectName.length === 0) {
    throw new ValidationError('Project name must not be empty', {
      context: { projectName }
    });
  }

  if (projectName.length > 100) {
    throw new ValidationError('Project name must be less than 100 characters', {
      context: { projectName }
    });
  }
}

function validateProjectDescription(
  projectDescription: string | null
): asserts projectDescription is string | null {
  if (projectDescription === null) {
    return;
  }

  if (typeof projectDescription !== 'string') {
    throw new ValidationError('Project description must be a string', {
      context: { projectDescription }
    });
  }

  if (projectDescription.length === 0) {
    throw new ValidationError('Project description must not be empty', {
      context: { projectDescription }
    });
  }

  if (projectDescription.length > 500) {
    throw new ValidationError(
      'Project description must be less than 500 characters',
      { context: { projectDescription } }
    );
  }
}

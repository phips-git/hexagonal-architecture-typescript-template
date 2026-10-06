import { Repository } from 'typeorm';
import type {
  Project,
  ProjectCreationRecord,
  ProjectId,
  ProjectReference,
  ProjectUpdateRecord
} from '../../../domain/models';
import type { ProjectPersistencePort } from '../../../domain/ports';
import type { ProjectEntity } from './entities/project.entity';

export class TypeOrmProjectPersistencePort implements ProjectPersistencePort {
  constructor(private readonly projectRepository: Repository<ProjectEntity>) {}

  async create(creationRecord: ProjectCreationRecord): Promise<void> {
    const projectEntity = this.projectRepository.create({
      name: creationRecord.name,
      description: creationRecord.description,
      createdAt: creationRecord.createdAt,
      updatedAt: creationRecord.updatedAt
    });

    await this.projectRepository.save(projectEntity);
  }

  async findReference(projectId: ProjectId): Promise<ProjectReference | null> {
    const project = await this.projectRepository.findOne({
      select: { id: true, name: true },
      where: { id: projectId }
    });

    if (!project) {
      return null;
    }

    return {
      id: project.id as ProjectId,
      name: project.name
    };
  }

  async findById(projectId: ProjectId): Promise<Project | null> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId }
    });

    if (!project) {
      return null;
    }

    return project.toDomain();
  }

  async update(
    projectId: ProjectId,
    updateRecord: ProjectUpdateRecord
  ): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    if (updateRecord.name !== undefined) {
      project.name = updateRecord.name;
    }

    if (updateRecord.description !== undefined) {
      project.description = updateRecord.description;
    }

    project.updatedAt = new Date();
    await this.projectRepository.save(project);
  }

  async remove(projectId: ProjectId): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    await this.projectRepository.remove(project);
  }
}

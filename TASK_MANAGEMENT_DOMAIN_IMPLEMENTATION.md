# Task Management Domain Implementation Guide

## Overview

Implement a complete **Task Management** domain package following the hexagonal architecture patterns from `@specbot/admin`, `@specbot/input-article`, and other bounded contexts in this repository.

This domain demonstrates all key architectural patterns:

- ✅ CRUD operations with strict layer boundaries
- ✅ Policy-based validation and authorization
- ✅ UnitOfWork for atomic multi-step database transactions
- ✅ Branded types for runtime type safety
- ✅ Domain error handling (ValidationError, NotFoundError, ForbiddenError)
- ✅ Port/Adapter abstraction for persistence

**Package name:** `@specbot/task-management`

---

## Domain Model

### Entities and Value Objects

Create the following models in `packages/task-management/src/domain/models/`:

#### 1. Task Status Enum

```typescript
// packages/task-management/src/domain/models/task-status.enum.ts
export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}
```

#### 2. Task Creation Properties

```typescript
// packages/task-management/src/domain/models/task.model.ts
export interface TaskCreationProperties {
  readonly title: string;
  readonly description?: string | undefined;
  readonly priority: TaskPriority;
  readonly assignedTo?: string | undefined; // userId reference
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}
```

#### 3. Task Entity (Persisted Record)

```typescript
export interface Task extends TaskCreationProperties {
  readonly id: TaskId;
  readonly projectId: ProjectId;
  readonly status: TaskStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string | undefined;
  readonly completionNotes?: string | undefined;
}

export interface TaskReference {
  readonly id: TaskId;
  readonly title: string;
}

export interface TaskListItem extends TaskReference {
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  readonly createdAt: string;
}
```

#### 4. Task Update Properties

```typescript
export interface TaskUpdateProperties {
  title?: string | undefined;
  description?: string | undefined;
  priority?: TaskPriority | undefined;
  status?: TaskStatus | undefined;
  assignedTo?: string | undefined;
  completionNotes?: string | undefined;
}
```

#### 5. Project Entity

```typescript
export interface ProjectCreationProperties {
  readonly name: string;
  readonly description?: string | undefined;
}

export interface Project extends ProjectCreationProperties {
  readonly id: ProjectId;
  readonly tenantId: TenantId;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ProjectReference {
  readonly id: ProjectId;
  readonly name: string;
}

export interface ProjectUpdateProperties {
  name?: string | undefined;
  description?: string | undefined;
}
```

#### 6. Authorization Context

```typescript
// packages/task-management/src/domain/models/authorization-context.model.ts
import type { UserRole } from '@specbot/common/domain';

export interface TaskScopeAuthorizationContext {
  readonly role: UserRole;
  readonly tenantId: TenantId | null; // null for admin users
  readonly projectId: ProjectId | null; // null for project-agnostic ops
}
```

#### 7. Branded Type Validation

```typescript
// packages/task-management/src/domain/models/branded-types.ts
import type { Brand } from '@specbot/utils';
import { ValidationError } from '@specbot/common/domain';

export type TaskId = Brand<string, 'TaskId'>;
export type ValidatedTaskId = Brand<string, 'ValidatedTaskId'>;

export function validateTaskId(taskId: TaskId): ValidatedTaskId {
  const validated = taskId.trim();
  if (!validated) {
    throw new ValidationError('Task id must not be empty');
  }
  return validated as ValidatedTaskId;
}

export type ProjectId = Brand<string, 'ProjectId'>;
export type ValidatedProjectId = Brand<string, 'ValidatedProjectId'>;

export function validateProjectId(projectId: ProjectId): ValidatedProjectId {
  const validated = projectId.trim();
  if (!validated) {
    throw new ValidationError('Project id must not be empty');
  }
  return validated as ValidatedProjectId;
}
```

Export all models from `packages/task-management/src/domain/models/index.ts`:

```typescript
export * from './task-status.enum';
export * from './task.model';
export * from './project.model';
export * from './authorization-context.model';
export * from './branded-types';
```

---

## Domain Policies

Create validation and authorization policies in `packages/task-management/src/domain/policies/`:

### File Structure

```
packages/task-management/src/domain/policies/
├── index.ts
├── task.policy.ts
├── project.policy.ts
└── tests/
    └── task.policy.test.ts
```

### Policy Patterns

#### Task Validation Functions

```typescript
// packages/task-management/src/domain/policies/task.policy.ts
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
  type ValidatedProjectId,
  type ValidatedTaskId
} from '@specbot/common/domain';
import type {
  ArticleScopeAuthorizationContext,
  TaskCreationProperties,
  TaskUpdateProperties,
  Task,
  TaskListItem
} from '../models';
import { TaskStatus, validateTaskId, validateProjectId } from '../models';

// Input validation
export function validateTaskCreationProperties(
  creationProperties: TaskCreationProperties
): ValidatedTaskCreationProperties {
  // Validate title
  const title = validateTaskTitle(creationProperties.title);

  // Validate description if present
  const description = creationProperties.description
    ? validateTaskDescription(creationProperties.description)
    : undefined;

  // Validate priority
  const priority = creationProperties.priority; // enum already constrained

  // Validate assignee if present
  const assignedTo = creationProperties.assignedTo
    ? validateUserId(creationProperties.assignedTo)
    : undefined;

  return {
    title,
    description,
    priority,
    assignedTo
  } as ValidatedTaskCreationProperties;
}

export function validateTaskUpdateProperties(
  updateProperties: TaskUpdateProperties
): ValidatedTaskUpdateProperties {
  const validated: TaskUpdateProperties = {};

  if (updateProperties.title !== undefined) {
    validated.title = validateTaskTitle(updateProperties.title);
  }

  if (updateProperties.description !== undefined) {
    validated.description = validateTaskDescription(
      updateProperties.description
    );
  }

  if (updateProperties.priority !== undefined) {
    validated.priority = updateProperties.priority;
  }

  if (updateProperties.status !== undefined) {
    validateTaskStatusTransition(
      updateProperties.status
      // status validation will be done by ensureCanUpdateTaskStatus
    );
  }

  if (updateProperties.assignedTo !== undefined) {
    if (updateProperties.assignedTo === null) {
      validated.assignedTo = null;
    } else {
      validated.assignedTo = validateUserId(updateProperties.assignedTo);
    }
  }

  if (updateProperties.completionNotes !== undefined) {
    if (updateProperties.completionNotes === null) {
      validated.completionNotes = null;
    } else {
      validated.completionNotes = validateCompletionNotes(
        updateProperties.completionNotes
      );
    }
  }

  if (Object.keys(validated).length === 0) {
    throw new ValidationError('At least one task property must be provided');
  }

  return validated as ValidatedTaskUpdateProperties;
}

// Reference validation
export function ensureTaskReferenceExists(
  taskReference: TaskReference | null,
  taskId: ValidatedTaskId
): asserts taskReference is TaskReference {
  if (!taskReference || taskReference.id !== taskId) {
    throw new NotFoundError('Task not found', {
      context: { taskId }
    });
  }
}

export function ensureProjectReferenceExists(
  projectReference: ProjectReference | null,
  projectId: ValidatedProjectId
): asserts projectReference is ProjectReference {
  if (!projectReference || projectReference.id !== projectId) {
    throw new NotFoundError('Project not found', {
      context: { projectId }
    });
  }
}

// Authorization
export function ensureCanCreateTask(
  authorizationContext: TaskScopeAuthorizationContext,
  projectId: ValidatedProjectId
): void {
  if (authorizationContext.role === UserRole.ADMIN) {
    return;
  }

  if (!authorizationContext.tenantId) {
    throw new ForbiddenError('User must belong to a tenant to create tasks', {
      context: { authorizationContext }
    });
  }

  // Additional project-level ownership checks if needed
}

export function ensureCanUpdateTask(
  authorizationContext: TaskScopeAuthorizationContext,
  task: Task,
  projectId: ValidatedProjectId,
  taskId: ValidatedTaskId
): void {
  if (authorizationContext.role === UserRole.ADMIN) {
    return;
  }

  if (!authorizationContext.tenantId) {
    throw new ForbiddenError('User must belong to a tenant to update tasks', {
      context: { authorizationContext }
    });
  }

  // Verify task belongs to the specified project
  if (task.projectId !== projectId) {
    throw new ForbiddenError('Task does not belong to the specified project', {
      context: { taskId, projectId }
    });
  }
}

export function ensureCanDeleteTask(
  authorizationContext: TaskScopeAuthorizationContext,
  task: Task,
  projectId: ValidatedProjectId,
  taskId: ValidatedTaskId
): void {
  if (authorizationContext.role === UserRole.ADMIN) {
    return;
  }

  if (!authorizationContext.tenantId) {
    throw new ForbiddenError('User must belong to a tenant to delete tasks', {
      context: { authorizationContext }
    });
  }

  if (task.projectId !== projectId) {
    throw new ForbiddenError('Task does not belong to the specified project', {
      context: { taskId, projectId }
    });
  }
}

// Status transition validation
export function ensureCanTransitionTaskStatus(
  currentStatus: TaskStatus,
  targetStatus: TaskStatus
): void {
  const validTransitions: Record<TaskStatus, TaskStatus[]> = {
    [TaskStatus.PENDING]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
    [TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED, TaskStatus.PENDING],
    [TaskStatus.COMPLETED]: [],
    [TaskStatus.CANCELLED]: [TaskStatus.PENDING]
  };

  const allowedTargets = validTransitions[currentStatus];

  if (!allowedTargets.includes(targetStatus)) {
    throw new ForbiddenError(
      `Cannot transition task from ${currentStatus} to ${targetStatus}`,
      { context: { currentStatus, targetStatus } }
    );
  }
}

// Helper validators
function validateTaskTitle(title: string): string {
  const validated = title.trim();
  if (!validated || validated.length === 0) {
    throw new ValidationError('Task title must not be empty');
  }
  if (validated.length > 200) {
    throw new ValidationError('Task title must not exceed 200 characters');
  }
  return validated;
}

function validateTaskDescription(description: string): string {
  if (description.length > 1000) {
    throw new ValidationError(
      'Task description must not exceed 1000 characters'
    );
  }
  return description.trim();
}

function validateCompletionNotes(notes: string): string {
  if (notes.length > 500) {
    throw new ValidationError(
      'Completion notes must not exceed 500 characters'
    );
  }
  return notes.trim();
}
```

#### Project Policies

```typescript
// packages/task-management/src/domain/policies/project.policy.ts
import {
  ForbiddenError,
  ValidationError,
  type ValidatedProjectId
} from '@specbot/common/domain';
import type {
  TaskScopeAuthorizationContext,
  ProjectCreationProperties,
  ProjectUpdateProperties
} from '../models';

export function validateProjectCreationProperties(
  creationProperties: ProjectCreationProperties
): ValidatedProjectCreationProperties {
  return {
    name: validateProjectName(creationProperties.name),
    description: creationProperties.description
      ? validateProjectDescription(creationProperties.description)
      : undefined
  } as ValidatedProjectCreationProperties;
}

export function validateProjectUpdateProperties(
  updateProperties: ProjectUpdateProperties
): ValidatedProjectUpdateProperties {
  const validated: ProjectUpdateProperties = {};

  if (updateProperties.name !== undefined) {
    validated.name = validateProjectName(updateProperties.name);
  }

  if (updateProperties.description !== undefined) {
    validated.description = validateProjectDescription(
      updateProperties.description
    );
  }

  if (Object.keys(validated).length === 0) {
    throw new ValidationError('At least one project property must be provided');
  }

  return validated as ValidatedProjectUpdateProperties;
}

export function ensureCanCreateProject(
  authorizationContext: TaskScopeAuthorizationContext
): void {
  if (authorizationContext.role === UserRole.ADMIN) {
    return;
  }

  if (!authorizationContext.tenantId) {
    throw new ForbiddenError(
      'User must belong to a tenant to create projects',
      { context: { authorizationContext } }
    );
  }
}

export function ensureCanUpdateProject(
  authorizationContext: TaskScopeAuthorizationContext,
  project: Project
): void {
  if (authorizationContext.role === UserRole.ADMIN) {
    return;
  }

  if (!authorizationContext.tenantId) {
    throw new ForbiddenError(
      'User must belong to a tenant to update projects',
      { context: { authorizationContext } }
    );
  }
}

export function ensureCanDeleteProject(
  authorizationContext: TaskScopeAuthorizationContext,
  project: Project
): void {
  if (authorizationContext.role === UserRole.ADMIN) {
    return;
  }

  if (!authorizationContext.tenantId) {
    throw new ForbiddenError(
      'User must belong to a tenant to delete projects',
      { context: { authorizationContext } }
    );
  }
}

function validateProjectName(name: string): string {
  const validated = name.trim();
  if (!validated || validated.length === 0) {
    throw new ValidationError('Project name must not be empty');
  }
  if (validated.length > 100) {
    throw new ValidationError('Project name must not exceed 100 characters');
  }
  return validated;
}

function validateProjectDescription(description: string): string {
  if (description.length > 500) {
    throw new ValidationError(
      'Project description must not exceed 500 characters'
    );
  }
  return description.trim();
}
```

Export all policies from `packages/task-management/src/domain/policies/index.ts`:

```typescript
export * from './task.policy';
export * from './project.policy';
```

---

## Domain Ports

Create persistence port interfaces in `packages/task-management/src/domain/ports/`:

### File Structure

```
packages/task-management/src/domain/ports/
├── index.ts
├── task-persistence.port.ts
├── project-persistence.port.ts
└── project-stats-persistence.port.ts
```

#### Task Persistence Port

```typescript
// packages/task-management/src/domain/ports/task-persistence.port.ts
import type { TransactionContext } from '@specbot/common/application';
import type {
  TaskCreationRecord,
  TaskListItem,
  TaskReference,
  TaskUpdateRecord,
  ValidatedTaskId,
  ValidatedProjectId
} from '../models';

export interface TaskPersistencePort {
  create(
    creationRecord: TaskCreationRecord,
    transaction?: TransactionContext
  ): Promise<void>;

  findReference(
    taskId: ValidatedTaskId,
    transaction?: TransactionContext
  ): Promise<TaskReference | null>;

  findAllByProject(
    projectId: ValidatedProjectId,
    transaction?: TransactionContext
  ): Promise<TaskListItem[]>;

  update(
    taskId: ValidatedTaskId,
    updateRecord: TaskUpdateRecord,
    transaction?: TransactionContext
  ): Promise<void>;

  remove(
    taskId: ValidatedTaskId,
    transaction?: TransactionContext
  ): Promise<void>;
}
```

#### Project Persistence Port

```typescript
// packages/task-management/src/domain/ports/project-persistence.port.ts
import type { TransactionContext } from '@specbot/common/application';
import type {
  ProjectCreationRecord,
  ProjectReference,
  ProjectUpdateRecord,
  ValidatedProjectId
} from '../models';

export interface ProjectPersistencePort {
  create(
    creationRecord: ProjectCreationRecord,
    transaction?: TransactionContext
  ): Promise<void>;

  findReference(
    projectId: ValidatedProjectId,
    transaction?: TransactionContext
  ): Promise<ProjectReference | null>;

  update(
    projectId: ValidatedProjectId,
    updateRecord: ProjectUpdateRecord,
    transaction?: TransactionContext
  ): Promise<void>;

  remove(
    projectId: ValidatedProjectId,
    transaction?: TransactionContext
  ): Promise<void>;
}
```

#### Project Stats Persistence Port (for UnitOfWork example)

```typescript
// packages/task-management/src/domain/ports/project-stats-persistence.port.ts
import type { TransactionContext } from '@specbot/common/application';
import type { ValidatedProjectId } from '../models';

export interface ProjectStatsPersistencePort {
  incrementTaskCount(
    projectId: ValidatedProjectId,
    timestamp: string,
    transaction?: TransactionContext
  ): Promise<void>;

  decrementTaskCount(
    projectId: ValidatedProjectId,
    timestamp: string,
    transaction?: TransactionContext
  ): Promise<void>;
}
```

Export all ports from `packages/task-management/src/domain/ports/index.ts`:

```typescript
export * from './task-persistence.port';
export * from './project-persistence.port';
export * from './project-stats-persistence.port';
```

---

## Application Layer: Use Cases

Create use cases in `packages/task-management/src/application/usecases/`:

### File Structure

```
packages/task-management/src/application/usecases/
├── index.ts
├── create-project.usecase.ts
├── update-project.usecase.ts
├── delete-project.usecase.ts
├── create-task.usecase.ts
├── update-task.usecase.ts
├── delete-task.usecase.ts
└── list-tasks.usecase.ts
```

### Use Case Patterns

#### 1. Create Project (Pattern A - Role Check)

```typescript
// packages/task-management/src/application/usecases/create-project.usecase.ts
import {
  Usecase,
  type LoggerPort,
  type UsecaseExecutionDependencies
} from '@specbot/common/application';
import type { TaskScopeAuthorizationContext } from '../../domain/models';
import {
  ensureCanCreateProject,
  validateProjectCreationProperties
} from '../../domain/policies';
import type { ProjectPersistencePort } from '../../domain/ports';
import { assembleProjectCreationRecord } from '../assemblers';

export interface CreateProjectInput {
  readonly authorizationContext: TaskScopeAuthorizationContext;
  readonly creationProperties: ProjectCreationProperties;
}

export class CreateProjectUsecase extends Usecase<CreateProjectInput, void> {
  constructor(
    dependencies: UsecaseExecutionDependencies,
    private readonly projectPersistence: ProjectPersistencePort
  ) {
    super(dependencies);
  }

  protected async executeInternal(
    { authorizationContext, creationProperties }: Readonly<CreateProjectInput>,
    logger: LoggerPort
  ): Promise<void> {
    void logger;

    ensureCanCreateProject(authorizationContext);

    const validatedCreationProperties =
      validateProjectCreationProperties(creationProperties);

    const creationRecord = assembleProjectCreationRecord(
      this.dependencies.generateId(),
      validatedCreationProperties
    );

    await this.projectPersistence.create(creationRecord);
  }
}
```

#### 2. Create Task (Pattern B - Entity-Aware + UnitOfWork)

**This is the key example demonstrating UnitOfWork for multi-step transactions.**

```typescript
// packages/task-management/src/application/usecases/create-task.usecase.ts
import {
  Usecase,
  type LoggerPort,
  type TransactionContext,
  type UnitOfWorkPort,
  type UsecaseExecutionDependencies
} from '@specbot/common/application';
import type {
  TaskScopeAuthorizationContext,
  TaskCreationProperties,
  ValidatedProjectId
} from '../../domain/models';
import {
  ensureCanCreateTask,
  ensureProjectReferenceExists,
  validateTaskCreationProperties,
  validateProjectId
} from '../../domain/policies';
import type {
  TaskPersistencePort,
  ProjectPersistencePort,
  ProjectStatsPersistencePort
} from '../../domain/ports';
import { assembleTaskCreationRecord } from '../assemblers';

export interface CreateTaskInput {
  readonly authorizationContext: TaskScopeAuthorizationContext;
  readonly projectId: ValidatedProjectId;
  readonly creationProperties: TaskCreationProperties;
}

export class CreateTaskUsecase extends Usecase<CreateTaskInput, void> {
  constructor(
    dependencies: UsecaseExecutionDependencies,
    private readonly unitOfWork: UnitOfWorkPort,
    private readonly taskPersistence: TaskPersistencePort,
    private readonly projectPersistence: ProjectPersistencePort,
    private readonly projectStatsPersistence: ProjectStatsPersistencePort
  ) {
    super(dependencies);
  }

  protected async executeInternal(
    {
      authorizationContext,
      projectId,
      creationProperties
    }: Readonly<CreateTaskInput>,
    logger: LoggerPort
  ): Promise<void> {
    void logger;

    const validatedProjectId = validateProjectId(projectId);

    // Ensure project exists
    const projectReference =
      await this.projectPersistence.findReference(validatedProjectId);
    ensureProjectReferenceExists(projectReference, validatedProjectId);

    // Authorize
    ensureCanCreateTask(authorizationContext, validatedProjectId);

    const validatedCreationProperties =
      validateTaskCreationProperties(creationProperties);

    const creationRecord = assembleTaskCreationRecord(
      this.dependencies.generateId(),
      validatedProjectId,
      validatedCreationProperties
    );

    // UnitOfWork: Atomic transaction for multi-step operation
    await this.unitOfWork.withTransaction(
      async (transaction: TransactionContext) => {
        // Step 1: Create the task
        await this.taskPersistence.create(creationRecord, transaction);

        // Step 2: Update project statistics
        await this.projectStatsPersistence.incrementTaskCount(
          validatedProjectId,
          new Date().toISOString(),
          transaction
        );
      }
    );
  }
}
```

#### 3. Update Task

```typescript
// packages/task-management/src/application/usecases/update-task.usecase.ts
import {
  Usecase,
  type LoggerPort,
  type UsecaseExecutionDependencies
} from '@specbot/common/application';
import type {
  TaskScopeAuthorizationContext,
  TaskUpdateProperties
} from '../../domain/models';
import {
  ensureCanUpdateTask,
  ensureTaskReferenceExists,
  ensureCanTransitionTaskStatus,
  validateTaskId,
  validateTaskUpdateProperties
} from '../../domain/policies';
import type { TaskPersistencePort } from '../../domain/ports';
import { assembleTaskUpdateRecord } from '../assemblers';

export interface UpdateTaskInput {
  readonly authorizationContext: TaskScopeAuthorizationContext;
  readonly projectId: string;
  readonly taskId: string;
  readonly updateProperties: TaskUpdateProperties;
}

export class UpdateTaskUsecase extends Usecase<UpdateTaskInput, void> {
  constructor(
    dependencies: UsecaseExecutionDependencies,
    private readonly taskPersistence: TaskPersistencePort
  ) {
    super(dependencies);
  }

  protected async executeInternal(
    {
      authorizationContext,
      projectId,
      taskId,
      updateProperties
    }: Readonly<UpdateTaskInput>,
    logger: LoggerPort
  ): Promise<void> {
    void logger;

    const validatedProjectId = validateProjectId(projectId);
    const validatedTaskId = validateTaskId(taskId);

    // Ensure task exists
    const taskReference =
      await this.taskPersistence.findReference(validatedTaskId);
    ensureTaskReferenceExists(taskReference, validatedTaskId);

    // Authorize
    ensureCanUpdateTask(
      authorizationContext,
      taskReference,
      validatedProjectId,
      validatedTaskId
    );

    // Validate update properties
    const validatedUpdateProperties =
      validateTaskUpdateProperties(updateProperties);

    // If status transition is requested, validate it
    if (validatedUpdateProperties.status !== undefined) {
      // We need the current status - will be fetched in the port
      // For simplicity, assume we get the full task in findReference
      // or we could add a separate find method
      // This is a design decision: either return full entity or add status validation here
    }

    const updateRecord = assembleTaskUpdateRecord(validatedUpdateProperties);

    await this.taskPersistence.update(validatedTaskId, updateRecord);
  }
}
```

#### 4. Delete Task

```typescript
// packages/task-management/src/application/usecases/delete-task.usecase.ts
import {
  Usecase,
  type LoggerPort,
  type UsecaseExecutionDependencies
} from '@specbot/common/application';
import type { TaskScopeAuthorizationContext } from '../../domain/models';
import {
  ensureCanDeleteTask,
  ensureTaskReferenceExists,
  validateTaskId,
  validateProjectId
} from '../../domain/policies';
import type {
  TaskPersistencePort,
  ProjectStatsPersistencePort
} from '../../domain/ports';

export interface DeleteTaskInput {
  readonly authorizationContext: TaskScopeAuthorizationContext;
  readonly projectId: string;
  readonly taskId: string;
}

export class DeleteTaskUsecase extends Usecase<DeleteTaskInput, void> {
  constructor(
    dependencies: UsecaseExecutionDependencies,
    private readonly taskPersistence: TaskPersistencePort,
    private readonly projectStatsPersistence: ProjectStatsPersistencePort
  ) {
    super(dependencies);
  }

  protected async executeInternal(
    { authorizationContext, projectId, taskId }: Readonly<DeleteTaskInput>,
    logger: LoggerPort
  ): Promise<void> {
    void logger;

    const validatedProjectId = validateProjectId(projectId);
    const validatedTaskId = validateTaskId(taskId);

    // Ensure task exists
    const taskReference =
      await this.taskPersistence.findReference(validatedTaskId);
    ensureTaskReferenceExists(taskReference, validatedTaskId);

    // Authorize
    ensureCanDeleteTask(
      authorizationContext,
      taskReference,
      validatedProjectId,
      validatedTaskId
    );

    await this.taskPersistence.remove(validatedTaskId);
  }
}
```

#### 5. List Tasks

```typescript
// packages/task-management/src/application/usecases/list-tasks.usecase.ts
import {
  Usecase,
  type LoggerPort,
  type UsecaseExecutionDependencies
} from '@specbot/common/application';
import type { TaskScopeAuthorizationContext } from '../../domain/models';
import { validateProjectId } from '../../domain/policies';
import type { TaskPersistencePort } from '../../domain/ports';

export interface ListTasksInput {
  readonly authorizationContext: TaskScopeAuthorizationContext;
  readonly projectId: string;
}

export interface ListTasksOutput {
  readonly tasks: readonly TaskListItem[];
}

export class ListTasksUsecase extends Usecase<ListTasksInput, ListTasksOutput> {
  constructor(
    dependencies: UsecaseExecutionDependencies,
    private readonly taskPersistence: TaskPersistencePort
  ) {
    super(dependencies);
  }

  protected async executeInternal(
    { authorizationContext, projectId }: Readonly<ListTasksInput>,
    logger: LoggerPort
  ): Promise<ListTasksOutput> {
    void logger;
    void authorizationContext; // For now, just validate the project exists

    const validatedProjectId = validateProjectId(projectId);

    const tasks =
      await this.taskPersistence.findAllByProject(validatedProjectId);

    return { tasks };
  }
}
```

Export all use cases from `packages/task-management/src/application/usecases/index.ts`:

```typescript
export * from './create-project.usecase';
export * from './update-project.usecase';
export * from './delete-project.usecase';
export * from './create-task.usecase';
export * from './update-task.usecase';
export * from './delete-task.usecase';
export * from './list-tasks.usecase';
```

---

## Application Layer: Assemblers

Create assembler functions in `packages/task-management/src/application/assemblers/`:

### File Structure

```
packages/task-management/src/application/assemblers/
├── index.ts
├── task.assembler.ts
└── project.assembler.ts
```

#### Task Assembler

```typescript
// packages/task-management/src/application/assemblers/task.assembler.ts
import type {
  TaskCreationRecord,
  TaskUpdateRecord,
  ValidatedTaskCreationProperties,
  ValidatedTaskUpdateProperties,
  ValidatedTaskId,
  ValidatedProjectId
} from '../../domain/models';

export function assembleTaskCreationRecord(
  id: ValidatedTaskId,
  projectId: ValidatedProjectId,
  creationProperties: ValidatedTaskCreationProperties
): TaskCreationRecord {
  const now = new Date().toISOString();

  return {
    ...creationProperties,
    id,
    projectId,
    status: 'PENDING', // Default status
    createdAt: now,
    updatedAt: now
  };
}

export function assembleTaskUpdateRecord(
  updateProperties: ValidatedTaskUpdateProperties
): TaskUpdateRecord {
  const now = new Date().toISOString();

  const updateRecord: TaskUpdateRecord = {
    ...updateProperties,
    updatedAt: now
  };

  // Auto-set completedAt when transitioning to COMPLETED
  if (updateProperties.status === 'COMPLETED') {
    (updateRecord as any).completedAt = now;
  }

  // Validate completionNotes when transitioning to COMPLETED
  if (
    updateProperties.status === 'COMPLETED' &&
    !updateProperties.completionNotes
  ) {
    throw new Error(
      'Completion notes are required when marking task as completed'
    );
  }

  return updateRecord;
}
```

#### Project Assembler

```typescript
// packages/task-management/src/application/assemblers/project.assembler.ts
import type {
  ProjectCreationRecord,
  ProjectUpdateRecord,
  ValidatedProjectCreationProperties,
  ValidatedProjectUpdateProperties
} from '../../domain/models';

export function assembleProjectCreationRecord(
  id: string,
  creationProperties: ValidatedProjectCreationProperties
): ProjectCreationRecord {
  const now = new Date().toISOString();

  return {
    ...creationProperties,
    id,
    createdAt: now,
    updatedAt: now
  };
}

export function assembleProjectUpdateRecord(
  updateProperties: ValidatedProjectUpdateProperties
): ProjectUpdateRecord {
  const now = new Date().toISOString();

  return {
    ...updateProperties,
    updatedAt: now
  };
}
```

Export all assemblers from `packages/task-management/src/application/assemblers/index.ts`:

```typescript
export * from './task.assembler';
export * from './project.assembler';
```

---

## Export Files

Export all layers from the package root:

### Domain Export

```typescript
// packages/task-management/src/domain.export.ts
export * from './domain/models';
export * from './domain/policies';
export * from './domain/ports';
```

### Application Export

```typescript
// packages/task-management/src/application.export.ts
export * from './application/usecases';
export * from './application/assemblers';
```

### Infrastructure Export

```typescript
// packages/task-management/src/infrastructure.export.ts
export * from './infrastructure/adapters';
```

---

## Infrastructure Layer: Adapters

Create Drizzle + libSQL adapters in `packages/task-management/src/infrastructure/adapters/`:

### File Structure

```
packages/task-management/src/infrastructure/adapters/
├── index.ts
├── task-persistence.drizzle-libsql.adapter.ts
├── project-persistence.drizzle-libsql.adapter.ts
├── project-stats-persistence.drizzle-libsql.adapter.ts
└── tests/
    └── task-persistence.adapter.test.ts
```

### Base Adapter Dependency

The adapters should extend `DatabaseAdapterBase` from `@specbot/common/infrastructure` (similar to how `AdminTenantPersistenceDrizzleLibSQLAdapter` extends it in the reference repo).

#### Task Persistence Adapter

```typescript
// packages/task-management/src/infrastructure/adapters/task-persistence.drizzle-libsql.adapter.ts
import { DatabaseAdapterBase } from '@specbot/common/infrastructure';
import type {
  DrizzleLibSQLDatabaseClient,
  DrizzleLibSQLTransaction
} from '@specbot/database/client';
import { eq } from 'drizzle-orm';
import type {
  TaskCreationRecord,
  TaskListItem,
  TaskReference,
  TaskUpdateRecord,
  ValidatedTaskId,
  ValidatedProjectId
} from '../../domain/models';
import type { TaskPersistencePort } from '../../domain/ports';

export class TaskManagementTaskPersistenceDrizzleLibSQLAdapter
  extends DatabaseAdapterBase<
    DrizzleLibSQLDatabaseClient,
    DrizzleLibSQLTransaction
  >
  implements TaskPersistencePort
{
  constructor(databaseClient: DrizzleLibSQLDatabaseClient) {
    super(databaseClient);
  }

  async create(
    creationRecord: TaskCreationRecord,
    transaction?: DrizzleLibSQLTransaction
  ): Promise<void> {
    await this.databaseClient(transaction)
      .insert(this.taskSchema())
      .values(creationRecord);
  }

  async findReference(
    taskId: ValidatedTaskId,
    transaction?: DrizzleLibSQLTransaction
  ): Promise<TaskReference | null> {
    const task = await this.databaseClient(
      transaction
    ).query.taskSchema.findFirst({
      columns: { id: true, title: true },
      where: eq(this.taskSchema().id, taskId)
    });

    if (!task) {
      return null;
    }

    return {
      id: task.id as ValidatedTaskId,
      title: task.title
    };
  }

  async findAllByProject(
    projectId: ValidatedProjectId,
    transaction?: DrizzleLibSQLTransaction
  ): Promise<TaskListItem[]> {
    const tasks = await this.databaseClient(
      transaction
    ).query.taskSchema.findMany({
      columns: {
        id: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true
      },
      where: eq(this.taskSchema().projectId, projectId)
    });

    return tasks.map((task) => ({
      ...task,
      id: task.id as ValidatedTaskId
    }));
  }

  async update(
    taskId: ValidatedTaskId,
    updateRecord: TaskUpdateRecord,
    transaction?: DrizzleLibSQLTransaction
  ): Promise<void> {
    await this.databaseClient(transaction)
      .update(this.taskSchema())
      .set(updateRecord)
      .where(eq(this.taskSchema().id, taskId));
  }

  async remove(
    taskId: ValidatedTaskId,
    transaction?: DrizzleLibSQLTransaction
  ): Promise<void> {
    await this.databaseClient(transaction)
      .delete(this.taskSchema())
      .where(eq(this.taskSchema().id, taskId));
  }

  // Helper to get the Drizzle schema (inject this from outside or create locally)
  private taskSchema() {
    // Import from your database package schema definition
    return this.databaseClient().taskSchema;
  }
}
```

#### Project Persistence Adapter

```typescript
// packages/task-management/src/infrastructure/adapters/project-persistence.drizzle-libsql.adapter.ts
import { DatabaseAdapterBase } from '@specbot/common/infrastructure';
import type {
  DrizzleLibSQLDatabaseClient,
  DrizzleLibSQLTransaction
} from '@specbot/database/client';
import { eq } from 'drizzle-orm';
import type {
  ProjectCreationRecord,
  ProjectReference,
  ProjectUpdateRecord,
  ValidatedProjectId
} from '../../domain/models';
import type { ProjectPersistencePort } from '../../domain/ports';

export class TaskManagementProjectPersistenceDrizzleLibSQLAdapter
  extends DatabaseAdapterBase<
    DrizzleLibSQLDatabaseClient,
    DrizzleLibSQLTransaction
  >
  implements ProjectPersistencePort
{
  constructor(databaseClient: DrizzleLibSQLDatabaseClient) {
    super(databaseClient);
  }

  async create(
    creationRecord: ProjectCreationRecord,
    transaction?: DrizzleLibSQLTransaction
  ): Promise<void> {
    await this.databaseClient(transaction)
      .insert(this.projectSchema())
      .values(creationRecord);
  }

  async findReference(
    projectId: ValidatedProjectId,
    transaction?: DrizzleLibSQLTransaction
  ): Promise<ProjectReference | null> {
    const project = await this.databaseClient(
      transaction
    ).query.projectSchema.findFirst({
      columns: { id: true, name: true },
      where: eq(this.projectSchema().id, projectId)
    });

    if (!project) {
      return null;
    }

    return {
      id: project.id as ValidatedProjectId,
      name: project.name
    };
  }

  async update(
    projectId: ValidatedProjectId,
    updateRecord: ProjectUpdateRecord,
    transaction?: DrizzleLibSQLTransaction
  ): Promise<void> {
    await this.databaseClient(transaction)
      .update(this.projectSchema())
      .set(updateRecord)
      .where(eq(this.projectSchema().id, projectId));
  }

  async remove(
    projectId: ValidatedProjectId,
    transaction?: DrizzleLibSQLTransaction
  ): Promise<void> {
    await this.databaseClient(transaction)
      .delete(this.projectSchema())
      .where(eq(this.projectSchema().id, projectId));
  }

  private projectSchema() {
    return this.databaseClient().projectSchema;
  }
}
```

#### Project Stats Persistence Adapter

```typescript
// packages/task-management/src/infrastructure/adapters/project-stats-persistence.drizzle-libsql.adapter.ts
import { DatabaseAdapterBase } from '@specbot/common/infrastructure';
import type {
  DrizzleLibSQLDatabaseClient,
  DrizzleLibSQLTransaction
} from '@specbot/database/client';
import { eq } from 'drizzle-orm';
import type { ValidatedProjectId } from '../../domain/models';
import type { ProjectStatsPersistencePort } from '../../domain/ports';

export class TaskManagementProjectStatsPersistenceDrizzleLibSQLAdapter
  extends DatabaseAdapterBase<
    DrizzleLibSQLDatabaseClient,
    DrizzleLibSQLTransaction
  >
  implements ProjectStatsPersistencePort
{
  constructor(databaseClient: DrizzleLibSQLDatabaseClient) {
    super(databaseClient);
  }

  async incrementTaskCount(
    projectId: ValidatedProjectId,
    timestamp: string,
    transaction?: DrizzleLibSQLTransaction
  ): Promise<void> {
    await this.databaseClient(transaction)
      .update(this.projectSchema())
      .set({
        taskCount: this.databaseClient(transaction).raw('task_count + 1'),
        lastActivityAt: timestamp
      })
      .where(eq(this.projectSchema().id, projectId));
  }

  async decrementTaskCount(
    projectId: ValidatedProjectId,
    timestamp: string,
    transaction?: DrizzleLibSQLTransaction
  ): Promise<void> {
    await this.databaseClient(transaction)
      .update(this.projectSchema())
      .set({
        taskCount: this.databaseClient(transaction).raw('task_count - 1'),
        lastActivityAt: timestamp
      })
      .where(eq(this.projectSchema().id, projectId));
  }

  private projectSchema() {
    return this.databaseClient().projectSchema;
  }
}
```

Export all adapters from `packages/task-management/src/infrastructure/adapters/index.ts`:

```typescript
export * from './task-persistence.drizzle-libsql.adapter';
export * from './project-persistence.drizzle-libsql.adapter';
export * from './project-stats-persistence.drizzle-libsql.adapter';
```

---

## Unit Tests

Create comprehensive tests for all use cases and adapters.

### Test Structure

```
packages/task-management/
├── src/
│   ├── domain/policies/tests/
│   │   └── task.policy.test.ts
│   └── infrastructure/adapters/tests/
│       └── task-persistence.adapter.test.ts
└── src/application/usecases/tests/
    └── create-task.usecase.test.ts
```

### Use Case Test Example

```typescript
// packages/task-management/src/application/usecases/tests/create-task.usecase.test.ts
import { describe, expect, it, beforeEach, vi } from 'bun:test';
import {
  CreateTaskUsecase,
  type CreateTaskInput
} from '../create-task.usecase';
import {
  TaskStatus,
  TaskPriority,
  type ValidatedProjectId,
  UserRole
} from '../../domain/models';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError
} from '@specbot/common/domain';

describe('CreateTaskUsecase', () => {
  let usecase: CreateTaskUsecase;
  let unitOfWorkMock: any;
  let taskPersistenceMock: any;
  let projectPersistenceMock: any;
  let projectStatsPersistenceMock: any;
  let idGeneratorMock: any;
  let loggerFactoryMock: any;

  beforeEach(() => {
    unitOfWorkMock = {
      withTransaction: vi.fn((fn) => fn({}))
    };

    taskPersistenceMock = {
      create: vi.fn()
    };

    projectPersistenceMock = {
      findReference: vi.fn()
    };

    projectStatsPersistenceMock = {
      incrementTaskCount: vi.fn()
    };

    idGeneratorMock = {
      generate: vi.fn(() => 'task-123')
    };

    loggerFactoryMock = vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }));

    usecase = new CreateTaskUsecase(
      {
        generateId: idGeneratorMock,
        loggerFactory: loggerFactoryMock
      },
      unitOfWorkMock,
      taskPersistenceMock,
      projectPersistenceMock,
      projectStatsPersistenceMock
    );
  });

  it('should create a task successfully', async () => {
    // Arrange
    const mockedProjectId = 'project-123' as ValidatedProjectId;
    projectPersistenceMock.findReference.mockResolvedValue({
      id: mockedProjectId,
      name: 'Test Project'
    });

    const input: CreateTaskInput = {
      authorizationContext: {
        role: UserRole.USER,
        tenantId: 'tenant-123',
        projectId: mockedProjectId
      },
      projectId: 'project-123',
      creationProperties: {
        title: 'Test Task',
        priority: TaskPriority.HIGH,
        description: 'Test description'
      }
    };

    // Act
    await usecase.execute(input);

    // Assert
    expect(projectPersistenceMock.findReference).toHaveBeenCalledWith(
      mockedProjectId
    );
    expect(taskPersistenceMock.create).toHaveBeenCalled();
    expect(projectStatsPersistenceMock.incrementTaskCount).toHaveBeenCalled();
    expect(unitOfWorkMock.withTransaction).toHaveBeenCalled();
  });

  it('should throw NotFoundError when project does not exist', async () => {
    // Arrange
    projectPersistenceMock.findReference.mockResolvedValue(null);

    const input: CreateTaskInput = {
      authorizationContext: {
        role: UserRole.USER,
        tenantId: 'tenant-123',
        projectId: 'non-existent'
      },
      projectId: 'non-existent',
      creationProperties: {
        title: 'Test Task',
        priority: TaskPriority.HIGH
      }
    };

    // Act & Assert
    await expect(usecase.execute(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw ValidationError for invalid input', async () => {
    // Arrange
    projectPersistenceMock.findReference.mockResolvedValue({
      id: 'project-123' as ValidatedProjectId,
      name: 'Test Project'
    });

    const input: CreateTaskInput = {
      authorizationContext: {
        role: UserRole.USER,
        tenantId: 'tenant-123',
        projectId: 'project-123'
      },
      projectId: 'project-123',
      creationProperties: {
        title: '', // Invalid
        priority: TaskPriority.HIGH
      }
    };

    // Act & Assert
    await expect(usecase.execute(input)).rejects.toThrow(ValidationError);
  });
});
```

### Policy Test Example

```typescript
// packages/task-management/src/domain/policies/tests/task.policy.test.ts
import { describe, expect, it } from 'bun:test';
import { TaskStatus, TaskPriority, UserRole } from '../../models';
import {
  validateTaskCreationProperties,
  validateTaskUpdateProperties,
  ensureCanTransitionTaskStatus,
  ForbiddenError,
  ValidationError
} from '../task.policy';

describe('Task Policies', () => {
  describe('validateTaskCreationProperties', () => {
    it('should validate valid task creation properties', () => {
      const result = validateTaskCreationProperties({
        title: 'Test Task',
        priority: TaskPriority.HIGH,
        description: 'Test description'
      });

      expect(result.title).toBe('Test Task');
      expect(result.priority).toBe(TaskPriority.HIGH);
    });

    it('should throw ValidationError for empty title', () => {
      expect(() =>
        validateTaskCreationProperties({
          title: '',
          priority: TaskPriority.HIGH
        })
      ).toThrow(ValidationError);
    });
  });

  describe('ensureCanTransitionTaskStatus', () => {
    it('should allow PENDING to IN_PROGRESS', () => {
      expect(() =>
        ensureCanTransitionTaskStatus(
          TaskStatus.PENDING,
          TaskStatus.IN_PROGRESS
        )
      ).not.toThrow();
    });

    it('should throw ForbiddenError for invalid transition', () => {
      expect(() =>
        ensureCanTransitionTaskStatus(TaskStatus.PENDING, TaskStatus.COMPLETED)
      ).toThrow(ForbiddenError);
    });
  });
});
```

---

## Composition Registration

Wire up the use cases and adapters in your API's composition file (e.g., `apps/api/src/composition.ts`):

```typescript
// apps/api/src/composition.ts (partial example)
import { TaskManagementTaskPersistenceDrizzleLibSQLAdapter } from '@specbot/task-management/infrastructure';
import {
  CreateTaskUsecase,
  UpdateTaskUsecase,
  DeleteTaskUsecase,
  ListTasksUsecase,
  CreateProjectUsecase,
  UpdateProjectUsecase,
  DeleteProjectUsecase
} from '@specbot/task-management/application';

// Register persistence adapters
const taskManagementTaskPersistence =
  new TaskManagementTaskPersistenceDrizzleLibSQLAdapter(databaseClient);

const taskManagementProjectPersistence =
  new TaskManagementProjectPersistenceDrizzleLibSQLAdapter(databaseClient);

const taskManagementProjectStatsPersistence =
  new TaskManagementProjectStatsPersistenceDrizzleLibSQLAdapter(databaseClient);

// Register use cases
const createTaskUsecase = new CreateTaskUsecase(
  usecaseDependencies,
  unitOfWork,
  taskManagementTaskPersistence,
  taskManagementProjectPersistence,
  taskManagementProjectStatsPersistence
);

const updateTaskUsecase = new UpdateTaskUsecase(
  usecaseDependencies,
  taskManagementTaskPersistence
);

// ... register other use cases

// Register with DI container / composition root
composition.register('createTaskUsecase', createTaskUsecase);
composition.register('updateTaskUsecase', updateTaskUsecase);
// ...
```

---

## API Route Integration Example

Create an API route module in `apps/api/src/modules/task-management/`:

```typescript
// apps/api/src/modules/task-management/task-management.routes.ts
import { Router } from 'elysia';
import { z } from 'zod';
import {
  validateTaskId,
  validateProjectId
} from '@specbot/task-management/domain';
import {
  CreateTaskUsecase,
  UpdateTaskUsecase,
  DeleteTaskUsecase,
  ListTasksUsecase
} from '@specbot/task-management/application';
import { getAuthorizationContext } from '@specbot/auth';

export function createTaskManagementRoutes(
  createTaskUsecase: CreateTaskUsecase,
  updateTaskUsecase: UpdateTaskUsecase,
  deleteTaskUsecase: DeleteTaskUsecase,
  listTasksUsecase: ListTasksUsecase
) {
  const router = new Router();

  // Create task
  router.post('/projects/:projectId/tasks', async ({ body, set, params }) => {
    const authorizationContext = getAuthorizationContext();
    const validatedProjectId = validateProjectId(params.projectId);

    const result = await createTaskUsecase.execute({
      authorizationContext,
      projectId: validatedProjectId,
      creationProperties: body
    });

    set.status = 201;
    return { success: true };
  });

  // List tasks
  router.get('/projects/:projectId/tasks', async ({ params, set }) => {
    const authorizationContext = getAuthorizationContext();
    const validatedProjectId = validateProjectId(params.projectId);

    const result = await listTasksUsecase.execute({
      authorizationContext,
      projectId: validatedProjectId
    });

    return { tasks: result.tasks };
  });

  // ... other routes
}
```

---

## Implementation Checklist

Follow this checklist to ensure complete implementation:

### Package Setup

- [ ] Create `packages/task-management` with `package.json`, `tsconfig.json`, `eslint.config.ts`
- [ ] Configure dependencies (`@specbot/common`, `@specbot/database`, `drizzle-orm`, `valibot`)
- [ ] Set up `src/domain/models/`, `src/domain/policies/`, `src/domain/ports/`
- [ ] Set up `src/application/usecases/`, `src/application/assemblers/`
- [ ] Set up `src/infrastructure/adapters/`, `src/infrastructure/adapters/tests/`

### Domain Layer

- [ ] Define `TaskStatus` enum
- [ ] Define `TaskPriority` enum
- [ ] Create `TaskCreationProperties`, `TaskUpdateProperties`, `Task`, `TaskReference`, `TaskListItem`
- [ ] Create `ProjectCreationProperties`, `ProjectUpdateProperties`, `Project`, `ProjectReference`
- [ ] Create `TaskScopeAuthorizationContext`
- [ ] Implement branded type validators (`validateTaskId`, `validateProjectId`)
- [ ] Export all models from `domain/models/index.ts`

### Policies Layer

- [ ] Implement `validateTaskCreationProperties`, `validateTaskUpdateProperties`
- [ ] Implement `ensureTaskReferenceExists`, `ensureProjectReferenceExists`
- [ ] Implement `ensureCanCreateTask`, `ensureCanUpdateTask`, `ensureCanDeleteTask`
- [ ] Implement `ensureCanTransitionTaskStatus` (status machine validation)
- [ ] Implement project policies (similar structure)
- [ ] Create unit tests for all policies
- [ ] Export all policies from `domain/policies/index.ts`

### Ports Layer

- [ ] Define `TaskPersistencePort` interface
- [ ] Define `ProjectPersistencePort` interface
- [ ] Define `ProjectStatsPersistencePort` interface
- [ ] Export all ports from `domain/ports/index.ts`

### Application Layer

- [ ] Implement `CreateProjectUsecase` (Pattern A)
- [ ] Implement `CreateTaskUsecase` (Pattern B + UnitOfWork)
- [ ] Implement `UpdateTaskUsecase` (Pattern B)
- [ ] Implement `DeleteTaskUsecase` (Pattern B)
- [ ] Implement `ListTasksUsecase` (read model)
- [ ] Implement `UpdateProjectUsecase`
- [ ] Implement `DeleteProjectUsecase`
- [ ] Create assemblers for all create/update operations
- [ ] Create unit tests for all use cases
- [ ] Export all use cases and assemblers

### Infrastructure Layer

- [ ] Implement `TaskManagementTaskPersistenceDrizzleLibSQLAdapter`
- [ ] Implement `TaskManagementProjectPersistenceDrizzleLibSQLAdapter`
- [ ] Implement `TaskManagementProjectStatsPersistenceDrizzleLibSQLAdapter`
- [ ] Create database schema (Drizzle tables for `tasks`, `projects`)
- [ ] Create unit tests for adapters
- [ ] Export all adapters from `infrastructure/adapters/index.ts`

### Integration

- [ ] Wire up all use cases and adapters in `apps/api/src/composition.ts`
- [ ] Create API routes for all use cases
- [ ] Integrate with authentication/authorization middleware
- [ ] Run full test suite: `bun run test --filter=@specbot/task-management`
- [ ] Run typecheck: `bun run typecheck --filter=@specbot/task-management`
- [ ] Run lint: `bun run lint --filter=@specbot/task-management`

---

## Key Patterns to Demonstrate

This implementation must clearly demonstrate:

1. **Hexagonal Architecture Boundaries**
   - Domain layer has no framework dependencies
   - Application layer uses ports, not concrete adapters
   - Infrastructure layer implements ports with Drizzle/SQL

2. **UnitOfWork Pattern**
   - `CreateTaskUsecase` uses `withTransaction` for atomic multi-step operations
   - Both task creation and stats update happen in one transaction
   - Transaction is passed to all persistence calls within the scope

3. **Policy-Based Authorization**
   - All use cases call `ensureCan*` policy functions
   - Policies throw `ForbiddenError` with appropriate context
   - Role checks (ADMIN bypass) + tenant ownership checks

4. **Branded Type Safety**
   - All IDs validated with branded types (`ValidatedTaskId`)
   - Validation happens early in use case execution
   - Validated types propagate through use case logic

5. **Domain Error Handling**
   - `ValidationError` for input validation failures
   - `NotFoundError` for missing entities
   - `ForbiddenError` for authorization failures
   - Errors preserve their type and context

6. **One-Way Dependency Flow**
   - Routes → Use Cases → Ports → Adapters
   - No circular dependencies between layers
   - Imports follow the dependency direction

---

## Testing Requirements

All code must be tested:

1. **Policy tests** - Test all validation and authorization functions
2. **Use case tests** - Mock all ports, test all success and error paths
3. **Adapter tests** - If possible, use in-memory SQLite or test container
4. **Coverage requirements**:
   - All validation edge cases
   - All authorization failures
   - All not found scenarios
   - Happy paths for all use cases

---

## Final Notes

This task management domain should serve as a **reference implementation** for any future domain packages in the template repository. It demonstrates:

- Clean separation of concerns
- Reusable architectural patterns
- Comprehensive error handling
- Transactional integrity
- Policy-driven authorization

When another agent needs to create a new domain package, they can follow this structure and adapt it to their specific domain needs while maintaining the same architectural patterns.

# Task Management Domain Package

This package implements the Task Management domain following the hexagonal architecture pattern.

## Overview

This package provides a complete implementation of task and project management functionality, including:

- **Domain Layer**: Entities, value objects, **domain policies** (validation and authorization rules)
- **Application Layer**: Use cases for task and project operations
- **Infrastructure Layer**: Database adapters using Drizzle ORM with LibSQL
- **Composition Layer**: Dependency injection and composition roots

## Structure

```
packages/task-management/
├── src/
│   ├── domain/                    # Domain layer
│   │   ├── enums/
│   │   │   ├── task-status.ts     # TaskStatus enum (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
│   │   │   └── task-priority.ts   # TaskPriority enum (LOW, MEDIUM, HIGH, URGENT)
│   │   ├── types/
│   │   │   ├── task.ts            # Task entity
│   │   │   ├── task-creation-properties.ts
│   │   │   ├── task-update-properties.ts
│   │   │   ├── project.ts         # Project entity
│   │   │   ├── authorization-context.ts
│   │   │   ├── task-id.ts         # Branded TaskId type
│   │   │   └── project-id.ts      # Branded ProjectId type
│   │   ├── policies/              # Domain policies (validation & authorization)
│   │   │   ├── task-validation.ts       # Task creation/update validation
│   │   │   ├── task-update-validation.ts
│   │   │   ├── task-reference-exists.ts
│   │   │   ├── project-reference-exists.ts
│   │   │   ├── task-can-create.ts
│   │   │   ├── task-can-update.ts
│   │   │   ├── task-can-delete.ts
│   │   │   ├── task-status-transition.ts
│   │   │   ├── task-validation-helpers.ts
│   │   │   ├── project-validation.ts
│   │   │   ├── project-update-validation.ts
│   │   │   ├── project-can-create.ts
│   │   │   ├── project-can-update.ts
│   │   │   └── project-can-delete.ts
│   │   └── export.ts
│   │
│   ├── application/               # Application layer
│   │   ├── ports/
│   │   │   ├── task-persistence-port.ts
│   │   │   ├── project-persistence-port.ts
│   │   │   └── project-stats-persistence-port.ts
│   │   ├── usecases/
│   │   │   ├── create-task.usecase.ts
│   │   │   ├── update-task.usecase.ts
│   │   │   ├── delete-task.usecase.ts
│   │   │   ├── list-tasks.usecase.ts
│   │   │   ├── create-project.usecase.ts
│   │   │   ├── update-project.usecase.ts
│   │   │   └── delete-project.usecase.ts
│   │   ├── assemblers/
│   │   │   ├── task-assembler.ts
│   │   │   └── project-assembler.ts
│   │   └── export.ts
│   │
│   ├── infrastructure/            # Infrastructure layer
│   │   ├── adapters/
│   │   │   ├── db.ts              # Database connection
│   │   │   ├── schemas.ts         # Drizzle ORM schemas
│   │   │   ├── task-persistence-drizzle-libsql.adapter.ts
│   │   │   ├── project-persistence-drizzle-libsql.adapter.ts
│   │   │   └── project-stats-persistence-drizzle-libsql.adapter.ts
│   │   └── export.ts
│   │
│   ├── composition/               # Composition layer
│   │   ├── composition-root.ts    # Dependency injection
│   │   ├── in-memory-unit-of-work.ts
│   │   ├── libsql-unit-of-work.ts
│   │   └── export.ts
│   │
│   └── export.ts                  # Main export
│
└── package.json
```

## Key Patterns

### Domain Layer

- **Branded Types**: `TaskId` and `ProjectId` use TypeScript branded types for type safety
- **Enums**: `TaskStatus` and `TaskPriority` define valid domain values
- **Value Objects**: Creation and update properties separate input from entities
- **Domain Policies**: All business rules, validation, and authorization live here

### Policies (in Domain Layer)

- **Validation**: All inputs are validated before use (e.g., `validateTaskCreationProperties`)
- **Authorization**: Role-based access control (admin, member, viewer)
- **Entity State**: Status transition validation ensures only valid transitions occur

### Application Layer

- **Pattern A (Role Check)**: `CreateProjectUsecase` - Simple role check before creation
- **Pattern B (Entity-Aware + UnitOfWork)**: `CreateTaskUsecase` - Requires project reference validation

### Infrastructure Layer

- **Drizzle ORM**: Database schema and queries using Drizzle
- **LibSQL**: SQLite-based storage
- **Persistence Ports**: Clean interface abstraction for data access

## Usage

### Basic Example

```typescript
import { TaskManagementCompositionRoot } from '@hexagonal-ts-template/task-management/composition';
import { InMemoryUnitOfWork } from '@hexagonal-ts-template/task-management/composition';
import type { UsecaseExecutionDependencies } from '@hexagonal-ts-template/common';

// Create composition root
const unitOfWork = new InMemoryUnitOfWork();
const dependencies: UsecaseExecutionDependencies = {
  generateId: () => '123e4567-e89b-12d3-a456-426614174000',
  loggerFactory: (name) => ({
    info: () => {},
    warn: () => {},
    error: () => {}
  })
};

const compositionRoot = new TaskManagementCompositionRoot({
  unitOfWork,
  dependencies
});

// Use create task use case
const result = await compositionRoot.createTaskUsecase.execute({
  projectId: '123e4567-e89b-12d3-a456-426614174000',
  creationProperties: {
    title: 'My First Task',
    priority: 'HIGH',
    description: 'A task description'
  },
  authorizationContext: {
    role: 'admin',
    tenantId: 'tenant1',
    projectId: '123e4567-e89b-12d3-a456-426614174000'
  }
});

console.log('Created task:', result.taskId);
```

### Authorization Context

The `authorizationContext` object controls access:

```typescript
{
  role: 'admin' | 'member' | 'viewer';
  tenantId: string;
  projectId?: string; // Optional for some operations
}
```

- **admin**: Can create, update, and delete tasks/projects
- **member**: Can create and update tasks/projects, cannot delete
- **viewer**: Read-only access

### Task Status Transitions

Valid transitions are enforced by `ensureCanTransitionTaskStatus`:

- `PENDING` → `IN_PROGRESS` | `CANCELLED`
- `IN_PROGRESS` → `COMPLETED` | `CANCELLED` | `PENDING`
- `COMPLETED` → `CANCELLED`
- `CANCELLED` → (no transitions allowed)

## Tests

Run tests with:

```bash
npm test
```

## Database Schema

### Tasks Table

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  assigned_to TEXT,
  due_date TEXT,
  completion_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### Projects Table

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  task_count INTEGER NOT NULL DEFAULT 0,
  last_activity_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## Export Structure

### Domain Export

```typescript
import {
  TaskStatus,
  TaskPriority,
  Task,
  Project
} from '@hexagonal-ts-template/task-management/domain';
```

### Application Export

```typescript
import {
  CreateTaskUsecase,
  UpdateTaskUsecase,
  DeleteTaskUsecase,
  ListTasksUsecase
} from '@hexagonal-ts-template/task-management/application';
```

### Infrastructure Export

```typescript
import {
  TaskManagementTaskPersistenceDrizzleLibSQLAdapter,
  TaskManagementProjectPersistenceDrizzleLibSQLAdapter,
  initializeDatabase
} from '@hexagonal-ts-template/task-management/infrastructure';
```

### Composition Export

```typescript
import {
  TaskManagementCompositionRoot,
  InMemoryUnitOfWork
} from '@hexagonal-ts-template/task-management/composition';
```

## Development

### Adding New Use Cases

1. Define input/output interfaces
2. Create use case class extending `Usecase<TInput, TOutput>`
3. Implement `executeInternal` method
4. Add to `application/usecases/index.ts`
5. Register in composition root

### Adding New Policies

1. Create policy function in `policies/` directory
2. Import in use case
3. Call before business logic
4. Write tests

### Adding New Persistence Operations

1. Add interface method to appropriate `*PersistencePort`
2. Implement in adapter
3. Update schema if needed

## License

Internal use only - Part of hexagonal-architecture-typescript-template

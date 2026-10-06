# Task Management Domain Package

This package implements the Task Management domain following the hexagonal architecture pattern.

## Overview

This package provides a complete implementation of task and project management functionality, following hexagonal architecture with:

- **Domain Layer**: Entities, value objects, domain policies (validation and authorization rules)
- **Application Layer**: Use cases for task and project operations
- **Infrastructure Layer**: SQLite and TypeORM persistence adapters

## Structure

```
packages/task-management/
├── src/
│   ├── domain/                    # Domain layer
│   │   ├── models/
│   │   │   ├── task.ts            # Task entity
│   │   │   ├── project.ts         # Project entity
│   │   │   ├── task-priority.enum.ts
│   │   │   ├── task-status.enum.ts
│   │   │   ├── authorization-context.ts
│   │   │   └── tenant.ts
│   │   ├── policies/              # Domain policies (validation & authorization)
│   │   │   ├── task.policies.ts
│   │   │   └── project.policies.ts
│   │   ├── ports/
│   │   │   ├── task-persistence-port.ts
│   │   │   ├── project-persistence-port.ts
│   │   │   └── project-stats-persistence-port.ts
│   │   ├── validators/
│   │   │   ├── task.validators.ts
│   │   │   └── project.validators.ts
│   │   ├── assemblers/
│   │   │   ├── task-assembler.ts
│   │   │   └── project-assembler.ts
│   │   ├── domain.export.ts
│   │   └── application.export.ts
│   │
│   ├── application/               # Application layer
│   │   ├── usecases/
│   │   │   ├── create-task.usecase.ts
│   │   │   ├── update-task.usecase.ts
│   │   │   ├── delete-task.usecase.ts
│   │   │   ├── list-tasks.usecase.ts
│   │   │   ├── create-project.usecase.ts
│   │   │   ├── update-project.usecase.ts
│   │   │   └── delete-project.usecase.ts
│   │   └── application.export.ts
│   │
│   └── infrastructure/            # Infrastructure layer
│       ├── adapters/
│       │   ├── sqlite/
│       │   │   ├── sqlite-schema.ts
│       │   │   ├── sqlite.task-persistence.adapter.ts
│       │   │   ├── sqlite.project-persistence.adapter.ts
│       │   │   └── sqlite.project-stats-persistence.adapter.ts
│       │   ├── typeorm/
│       │   │   ├── typeorm-task-persistence-port.ts
│       │   │   ├── typeorm-project-persistence.adapter.ts
│       │   │   ├── typeorm-project-stats-persistence-port.ts
│       │   │   └── entities/
│       │   │       ├── task.entity.ts
│       │   │       ├── project.entity.ts
│       │   │       └── project-stats.entity.ts
│       │   └── index.ts
│       └── infrastructure.export.ts
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

- **SQLite**: SQLite-based storage with `better-sqlite3`
- **TypeORM**: Alternative ORM adapter for relational databases
- **Persistence Ports**: Clean interface abstraction for data access

## Usage

### Using Use Cases Directly

```typescript
import { CreateTaskUsecase } from '@hexagonal-ts-template/task-management/application';
import { TypeOrmTaskPersistencePort } from '@hexagonal-ts-template/task-management/infrastructure';
import type { TaskPersistencePort } from '@hexagonal-ts-template/task-management/domain';

// Create dependencies
const taskPersistence: TaskPersistencePort = new TypeOrmTaskPersistencePort(
  taskRepository
);

// Create use case
const createTaskUsecase = new CreateTaskUsecase(taskPersistence);

// Execute
const result = await createTaskUsecase.execute({
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
  TypeOrmTaskPersistencePort,
  TypeOrmProjectPersistenceAdapter,
  initializeSchema
} from '@hexagonal-ts-template/task-management/infrastructure';
```

## Development

### Adding New Use Cases

1. Define input/output interfaces
2. Create use case class extending `Usecase<TInput, TOutput>`
3. Implement `executeInternal` method
4. Add to `application/usecases/index.ts`
5. Register in composition root

### Adding New Policies

1. Create policy function in `domain/policies/` directory
2. Import in use case
3. Call before business logic
4. Write tests

### Adding New Persistence Operations

1. Add interface method to appropriate `*PersistencePort`
2. Implement in adapter
3. Update schema if needed

## License

Internal use only - Part of hexagonal-architecture-typescript-template

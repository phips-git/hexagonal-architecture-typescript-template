# AWS Lambda - Task Management

A minimal AWS Lambda implementation of task-management usecases following hexagonal architecture.

## Architecture

```
API Gateway → Lambda Functions → Use Cases → SQLite
```

## Project Structure

```
src/
└── lambda/                    # Individual Lambda functions
    ├── create-project.ts      # Uses: CreateProjectUsecase
    ├── create-task.ts         # Uses: CreateTaskUsecase
    ├── list-tasks.ts          # Uses: ListTasksUsecase
    ├── update-project.ts      # Uses: UpdateProjectUsecase
    ├── update-task.ts         # Uses: UpdateTaskUsecase
    ├── delete-project.ts      # Uses: DeleteProjectUsecase
    └── delete-task.ts         # Uses: DeleteTaskUsecase

package.json                   # Dependencies & scripts
README.md
```

## Implementation

Each Lambda function composes its usecase **once** at module level, reusing it across all invocations. Transactions are handled by the usecase itself via `UnitOfWorkPort.withTransaction()`.

```typescript
// Composed once at module level
const projectPersistence = new SqliteProjectPersistencePort();
const logger = createConsoleLogger('CreateProjectUsecase');

const createProjectUsecase = new CreateProjectUsecase(
  { generateId: () => require('uuid').v4(), loggerFactory: () => logger },
  projectPersistence,
  { withTransaction: async (work) => work() } // No-op for single-operation usecases
);

// Handler reuses the composed usecase
export const handler = async (event, context) => {
  await createProjectUsecase.execute(input);
};
```

For usecases that need transactions (e.g., `CreateTaskUsecase`), the task-management package wraps multiple persistence operations in a transaction:

```typescript
const taskId = await this.unitOfWork.withTransaction(async () => {
  const { id } = await this.taskPersistence.create(creationRecord);
  await this.projectStatsPersistence.incrementTaskCount(
    validatedProjectId,
    new Date()
  );
  return id;
});
```

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build
```

## Deploy

```bash
# Build for all functions
npm run build

# Deploy all Lambda functions
for func in create-project create-task list-tasks update-project update-task delete-project delete-task; do
  zip -r Lambda.zip dist/
  aws lambda update-function-code \
    --function-name $func \
    --zip-file fileb://Lambda.zip
done
```

## API Endpoints

| Method | Endpoint                               | Function       |
| ------ | -------------------------------------- | -------------- |
| POST   | `/projects`                            | create-project |
| POST   | `/projects/{id}/tasks`                 | create-task    |
| GET    | `/projects/{id}/tasks`                 | list-tasks     |
| PUT    | `/projects/{id}`                       | update-project |
| PUT    | `/projects/{projectId}/tasks/{taskId}` | update-task    |
| DELETE | `/projects/{id}`                       | delete-project |
| DELETE | `/projects/{projectId}/tasks/{taskId}` | delete-task    |

## Technology Stack

| Component   | Technology              |
| ----------- | ----------------------- |
| Runtime     | Node.js 20.x            |
| Build       | esbuild                 |
| Database    | SQLite                  |
| Logger      | ConsoleLoggerAdapter    |
| Persistence | Task-management package |

## Scripts

| Command             | Description            |
| ------------------- | ---------------------- |
| `npm run build`     | Build Lambda functions |
| `npm run typecheck` | TypeScript check       |

## License

MIT

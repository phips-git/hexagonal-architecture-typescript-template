# AWS Lambda - Task Management

A minimal AWS Lambda implementation of task-management usecases following hexagonal architecture. This app exposes CRUD operations for projects and tasks via API Gateway.

## Architecture

```
API Gateway → Lambda Functions → Use Cases → SQLite
```

## Project Structure

```
src/
└── lambda/                    # Individual Lambda functions
    ├── create-project.ts
    ├── create-task.ts
    ├── list-tasks.ts
    ├── update-project.ts
    ├── update-task.ts
    ├── delete-project.ts
    └── delete-task.ts

package.json                   # Dependencies & scripts
README.md
```

## Quick Start

```bash
# Install dependencies
npm install

# Initialize the database (required before running dev)
npm run db:init

# Typecheck
npm run typecheck

# Build for deployment
npm run build
```

## Deployment

Build the Lambda functions:

```bash
npm run build
```

This bundles all Lambda functions into a single `dist/` directory. Each function is bundled as CommonJS (CJS) compatible with Node.js 22.x runtime.

> **Note**: Use AWS SAM, CDK, or Serverless Framework for proper infrastructure provisioning (API Gateway, Lambda functions, IAM roles, and database connectivity).

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

## Scripts

| Command             | Description                           |
| ------------------- | ------------------------------------- |
| `npm run build`     | Build Lambda functions                |
| `npm run db:init`   | Initialize the database schema        |
| `npm run typecheck` | TypeScript check                      |
| `npm run dev`       | Start LocalStack (runs db:init first) |
| `npm run dev:stop`  | Stop LocalStack                       |

## License

MIT

# NestJS API Gateway

NestJS-based API implementation for task and project management following hexagonal architecture.

## Architecture

```
HTTP → NestJS Controllers → NestJS Services → Task Management Package → SQLite/TypeORM
```

## Project Structure

```
src/
├── main.ts                        # Application entry point
├── app.module.ts                  # Root NestJS module
├── infrastructure/                # Infrastructure concerns
│   ├── config/
│   │   └── app.config.ts          # Application configuration
│   ├── config-database.module.ts  # Database module
│   ├── database.service.ts        # Database connection service
│   ├── exceptions/
│   │   ├── all-exceptions.filter.ts
│   │   └── validation.exception.filter.ts
│   └── guards/
│       └── jwt-auth.guard.ts      # JWT authentication guard
├── projects/                      # Projects domain
│   ├── projects.controller.ts     # REST endpoints
│   ├── projects.service.ts        # Business logic
│   ├── projects.module.ts         # NestJS module
│   └── dtos/
│       └── create-project.dto.ts  # Validation DTOs
├── tasks/                         # Tasks domain
│   ├── tasks.controller.ts        # REST endpoints
│   ├── tasks.service.ts           # Business logic
│   ├── tasks.module.ts            # NestJS module
│   └── dtos/
│       └── create-task.dto.ts     # Validation DTOs
└── scripts/
    └── init-db.ts                 # Database initialization script
```

## Features

- **RESTful API**: Standard HTTP endpoints for CRUD operations
- **JWT Authentication**: Token-based authentication and authorization
- **Validation**: Class-validator decorators for request validation
- **Error Handling**: Centralized exception filters
- **Hexagonal Architecture**: Leverages `@hexagonal-ts-template/task-management` package

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Initialize the database
npm run db:init

# Start development server
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod
```

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=./database.sqlite

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
```

## API Endpoints

### Projects

| Method | Endpoint        | Description         |
| ------ | --------------- | ------------------- |
| POST   | `/projects`     | Create a project    |
| GET    | `/projects`     | List all projects   |
| GET    | `/projects/:id` | Get project details |
| PUT    | `/projects/:id` | Update a project    |
| DELETE | `/projects/:id` | Delete a project    |

### Tasks

| Method | Endpoint                     | Description            |
| ------ | ---------------------------- | ---------------------- |
| POST   | `/projects/:projectId/tasks` | Create a task          |
| GET    | `/projects/:projectId/tasks` | List tasks for project |
| GET    | `/tasks/:id`                 | Get task details       |
| PUT    | `/tasks/:id`                 | Update a task          |
| DELETE | `/tasks/:id`                 | Delete a task          |

## Scripts

| Command             | Description                         |
| ------------------- | ----------------------------------- |
| `npm run start`     | Start production server             |
| `npm run start:dev` | Start development server with watch |
| `npm run build`     | Build the application               |
| `npm run db:init`   | Initialize database schema          |
| `npm test`          | Run tests                           |

## Authentication

Authentication is handled via JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## License

MIT

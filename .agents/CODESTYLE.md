# Codestyle Guidelines

## General Principles

### Clean Code

- Write code that is self-explanatory
- Prefer clear, descriptive names over clever abbreviations
- Keep functions small and focused on a single responsibility
- Follow the Single Responsibility Principle rigorously

### No Unnecessary Comments

- Comments should explain **why**, not **what**
- If code requires a comment to understand, refactor the code instead
- Never comment out dead code - remove it
- JSDoc is only for public API surface, not internal implementation

### No Shimming or Re-exports

- Import directly from source modules
- Do not re-export for convenience - it adds unnecessary indirection
- Each package exports its own public API clearly
- If something needs to be in another package, move it there

## Imports

- Import from source: `from '@hexagonal-ts-template/task-management/infrastructure'`
- Don't create convenience re-exports in intermediate index files
- Type imports must use `import type` for type-only exports
- Keep imports grouped and sorted alphabetically within groups

## Comments

Only add comments when the code itself cannot express the intent:

- Explain complex business rules
- Document non-obvious decisions or trade-offs
- Mark technical debt or TODOs with context
- Explain constraints or assumptions

### Avoid These

```typescript
// Don't do this:
const x = 42; // x is 42

// Do this instead:
const maxRetries = 42; // Clear intent from name
```

## Naming Conventions

- Classes: PascalCase (`SqliteDatabaseClient`)
- Functions/variables: camelCase (`initializeSchema`)
- Constants: UPPER_SNAKE_CASE (`DB_PATH`)
- Type aliases: PascalCase (`TaskStatus`)
- Files: match the exported name (lowercase with hyphens or PascalCase)

## Type Safety

- **All code must be completely typesafe** - no `any` types unless absolutely necessary
- Use branded types for domain entities (`TaskId`, `ProjectId`) to prevent type confusion
- Never use `as string` for type assertions - validate and transform properly
- Use `import type` for type-only imports to avoid runtime overhead
- Function parameters and return types must be explicitly declared (no implicit `any`)
- See [TypeScript Best Practices](/docs/typescript.md) for detailed guidelines

## File Structure

- Keep files focused - if a file grows beyond 200-300 lines, consider splitting
- Place related code together in the same file or package
- Export only what's needed - no barrel files that export everything

## Dependencies

- Common package: Generic, reusable code (no app-specific logic)
- Domain package: Pure domain models and business rules
- Application package: Use cases, orchestration logic
- Infrastructure package: Implementation of ports (db, logging, etc.)

## Module Exports

```json
{
  "exports": {
    "./application": "./src/application.export.ts",
    "./domain": "./src/domain.export.ts",
    "./infrastructure": "./src/infrastructure.export.ts"
  }
}
```

Import using these subpath exports - don't create new subpaths for convenience.

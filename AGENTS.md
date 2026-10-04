# Agent Configuration

This folder contains configuration and documentation for AI agents working with the codebase.

## Documentation

- **[CODESTYLE.md](./CODESTYLE.md)** - Coding standards, best practices, and naming conventions

## Guidelines

Agents should follow the codestyle guidelines when generating or modifying code. Key principles:

- Write self-explanatory code with clear naming
- Maintain complete type safety (no `any` types)
- No unnecessary comments or JSDoc
- Import directly from source modules
- Follow hexagonal architecture boundaries

## Available Skills

See the `skill` tool for available capabilities like:

- `safe-refactor` - Restructure code while preserving behavior
- `surgical-patch` - Fix bugs with minimal changes
- `lean-build` - Build features with strict scope

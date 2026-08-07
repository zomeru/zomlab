# AGENTS.md

> Instructions for AI coding agents working on **ZomLab**.
>
> This document contains implementation details, coding conventions, architectural decisions, and project expectations that complement the human-facing `README.md`.

---

# Project Overview

ZomLab is a personal software engineering laboratory and interactive knowledge base.

The primary goal is **learning through implementation**, not simply building features.

Every feature should:

- Demonstrate a real-world implementation
- Be production-quality
- Be fully typed
- Be reusable
- Include documentation
- Be easy to understand months later
- Prioritize maintainability over cleverness

This repository is intended to grow for years.

Favor scalability and consistency.

---

# Core Philosophy

Always optimize for:

1. Readability
2. Maintainability
3. Type Safety
4. Reusability
5. Simplicity
6. Performance
7. Developer Experience

Never introduce unnecessary abstractions.

Prefer explicit code over "magic."

---

# Tech Stack

## Monorepo

- Turborepo
- Bun Workspace

## Frontend

- React
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- TanStack Query

## Backend

- Elysia
- Next.js Route Handlers

## Validation

- Zod

## Database

- PostgreSQL
- Prisma

## Cache

- Redis

## Authentication

- Better Auth

## Realtime

- Elysia WebSocket
- Native WebSocket
- Socket.IO (only when necessary)

## Documentation

- MDX
- Mermaid

## Tooling

- Biome
- Husky
- lint-staged

---

# Node & Runtime

Required versions

```
Node >=24
Bun (latest stable)
TypeScript ^6
```

Do not downgrade dependencies unless explicitly requested.

---

# Repository Structure

```
apps/
    web/
    api/
    docs/

packages/
    auth/
    cache/
    config/
    contracts/
    database/
    env/
    hooks/
    logger/
    types/
    ui/
    utils/
    validation/

docker/

scripts/

.github/
```

Never place reusable logic inside apps if it belongs in packages.

---

# Package Responsibilities

## apps/web

Contains:

- UI
- Pages
- Layouts
- Client Components
- Server Components

Business logic should be minimal.

---

## apps/api

Standalone Elysia server.

Responsible for:

- WebSockets
- Webhooks
- Streaming
- Background APIs
- Long-running requests

---

## packages/contracts

Single source of truth.

Contains:

- Zod schemas
- DTOs
- Shared API types
- Request types
- Response types

Never duplicate types.

---

## packages/database

Contains:

- Prisma schema
- Prisma client
- Seed scripts
- Migrations
- Database helpers

---

## packages/auth

Contains Better Auth configuration.

Should be reusable by:

- Next.js
- Elysia

Never duplicate auth logic.

---

## packages/ui

Reusable UI components.

No business logic.

---

## packages/utils

Pure utility functions only.

Avoid framework-specific utilities.

---

# Architecture

Preferred architecture

```
UI

↓

Hooks

↓

API Layer

↓

Service

↓

Repository

↓

Database
```

Never access Prisma directly from UI.

Never perform business logic inside components.

---

# Feature Organization

Each feature should follow this structure.

```
feature/

components/

hooks/

services/

repositories/

api/

schemas/

types/

utils/

constants/

tests/

docs/
```

Avoid dumping unrelated files together.

---

# Naming Conventions

Folders

```
kebab-case
```

Files

```
kebab-case.ts

user-service.ts

create-payment.ts

use-auth.ts
```

Components

```
PascalCase
```

Hooks

```
useSomething
```

Types

```
Something

SomethingRequest

SomethingResponse
```

Enums

```
SomethingStatus
```

Constants

```
UPPER_SNAKE_CASE
```

---

# TypeScript

Always enable strict typing.

Never use:

```
any
```

Prefer

```
unknown
```

or proper generics.

Always infer types whenever possible.

Avoid unnecessary type aliases.

---

# React

Prefer

Server Components whenever possible.

Use Client Components only when needed.

Keep components small.

Split components before they become difficult to understand.

Avoid prop drilling.

Extract reusable hooks.

---

# State Management

Priority

1. React State
2. URL State
3. TanStack Query
4. Context

Avoid global state unless necessary.

---

# Data Fetching

Use

TanStack Query

for client fetching.

Use

Server Components

for initial rendering whenever possible.

---

# Forms

Use

React Hook Form

-

Zod

Never manually validate forms.

---

# Styling

Use

Tailwind CSS

Do not introduce another CSS framework.

Prefer utility classes.

Extract repeated patterns into components.

---

# Backend

Prefer Elysia.

Next.js Route Handlers are acceptable for:

- Authentication
- Small APIs
- Server Actions

Prefer Elysia for:

- Streaming
- WebSockets
- Webhooks
- Long-running APIs

---

# API Design

Prefer REST.

Use nouns.

Good

```
GET /users

POST /payments

DELETE /posts/:id
```

Bad

```
/getUsers

/deletePost

/createSomething
```

---

# Validation

Always validate:

- Request
- Response (when appropriate)
- Environment variables

Never trust user input.

---

# Database

Never expose Prisma directly.

Always use repositories.

Business logic belongs in services.

---

# Authentication

All authentication must go through

packages/auth

Do not duplicate auth implementations.

---

# Caching

Prefer Redis.

Cache expensive operations.

Always consider invalidation strategy.

---

# Error Handling

Return meaningful errors.

Never swallow exceptions.

Never expose sensitive information.

---

# Logging

Log important events.

Avoid noisy logs.

Never log:

- Passwords
- Secrets
- Tokens
- API keys

---

# Security

Always consider:

- XSS
- CSRF
- SQL Injection
- Rate Limiting
- Input Validation
- Output Encoding

Security should not be optional.

---

# Performance

Prefer:

- Memoization
- Lazy Loading
- Dynamic Imports
- Virtualization
- Image Optimization

Measure before optimizing.

Do not prematurely optimize.

---

# Accessibility

Always support:

- Keyboard navigation
- Screen readers
- Proper labels
- Semantic HTML

Accessibility is a requirement.

---

# Testing

Preferred order

1. Unit
2. Integration
3. E2E

Test behavior.

Avoid testing implementation details.

---

# Documentation

Every major feature should include:

- Overview
- Architecture
- Request Flow
- Database
- Usage
- Common Pitfalls

Use Mermaid diagrams whenever helpful.

---

# Comments

Write self-documenting code first.

Do **not** add comments everywhere.

Only add comments when they explain:

- Non-obvious business rules
- Complex algorithms
- Performance optimizations
- Browser or framework quirks
- Important implementation decisions

Comments must be:

- Short
- Concise
- Accurate

Good

```ts
// Prevent duplicate webhook processing.
```

```ts
// Keep socket alive.
```

```ts
// Batch updates to reduce re-renders.
```

Bad

```ts
// Create user object
const user = {};
```

```ts
// Loop through array
for (...) {}
```

Avoid redundant comments.

---

# Code Style

Prefer early returns.

Avoid deeply nested conditions.

Extract reusable logic.

Keep functions focused.

Prefer composition over inheritance.

Avoid large files.

General guidelines:

- Components: ~200 lines max
- Hooks: ~150 lines max
- Services: ~250 lines max

Split files when they become difficult to navigate.

---

# Imports

Order imports:

1. Node
2. External packages
3. Internal packages
4. Relative imports
5. Styles

Keep imports organized.

---

# Dependencies

Before adding a dependency, ask:

- Can the platform already do this?
- Can an existing dependency do this?
- Is this package actively maintained?
- Is the bundle size reasonable?

Avoid unnecessary dependencies.

---

# Git

Commits should follow Conventional Commits.

Examples

```
feat(auth): add OAuth login

fix(payments): prevent duplicate webhook

refactor(ai): simplify streaming logic

docs(readme): update installation

test(chat): add websocket tests
```

---

# Pull Requests

Changes should:

- Compile successfully
- Pass linting
- Pass tests
- Follow project conventions
- Maintain type safety

Do not leave unfinished code unless explicitly requested.

---

# Agent Expectations

When making changes:

- Preserve existing architecture.
- Prefer consistency over personal preference.
- Reuse existing packages before creating new ones.
- Avoid duplication.
- Keep APIs predictable.
- Keep abstractions minimal.
- Favor readability over cleverness.
- Follow the project's established patterns.
- If introducing a new pattern, ensure it has a clear long-term benefit and is applied consistently.

The goal is to make ZomLab feel like a cohesive, production-quality engineering handbook rather than a collection of disconnected demos.

# Other Instructions

<!-- BEGIN:nextjs-agent-rules -->

## Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

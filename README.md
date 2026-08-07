# ZomLab

> **An interactive full-stack engineering playground and knowledge base.**
>
> ZomLab is my personal software engineering laboratory where I learn, experiment, document, and showcase modern technologies through real, interactive implementations.
>
> Instead of creating dozens of isolated demo repositories, everything lives in one monorepo. Every feature includes a working UI, production-like architecture, documentation, and code that explains how it works under the hood.

---

## Philosophy

Most tutorials show **what** to build.

ZomLab focuses on:

- **How** it works
- **Why** it works
- **When** to use it
- **Common mistakes**
- **Performance implications**
- **Security considerations**
- **Production-ready architecture**

Every feature is implemented as if it were part of a real-world application.

---

# Goals

- Learn modern software engineering through implementation
- Create an interactive engineering handbook
- Keep every experiment in a single repository
- Document every architecture decision
- Compare different approaches to solving the same problem
- Build reusable packages
- Practice enterprise architecture
- Have a personal reference whenever I forget how something works

---

# Project Structure

Every feature contains:

- Live Demo
- Source Code
- Documentation
- Architecture
- API Flow
- Database Schema
- Performance Notes
- Security Notes
- Best Practices

Example:

```
Payments

├── Live Demo
├── Source Code
├── Documentation
├── Architecture
├── Request Flow
├── Database
├── Webhooks
├── Security
├── Performance
└── Common Mistakes
```

---

# Planned Modules

## Core

- Routing
- Forms
- CRUD
- Pagination
- Infinite Scroll
- Search
- Filtering
- Sorting
- File Uploads
- Downloads
- CSV Import/Export

---

## Authentication

- Better Auth
- Session Authentication
- JWT
- OAuth
- Magic Links
- Passkeys
- RBAC
- Permission Management

---

## Databases

- PostgreSQL
- Prisma
- Transactions
- Indexing
- Full Text Search
- JSON Columns
- Soft Deletes
- Optimistic Updates

---

## Caching

- Redis
- Cache Invalidation
- Response Cache
- Query Cache
- Distributed Cache

---

## Realtime

- WebSockets
- Elysia WebSocket
- Socket.IO
- Presence
- Notifications
- Chat
- Typing Indicators

---

## Payments

- Stripe
- PayPal
- PayMongo
- Checkout
- Subscriptions
- Webhooks
- Idempotency

---

## Webhooks

- Stripe
- GitHub
- Discord
- Slack
- Retry Mechanism
- Signature Validation

---

## Generative AI

### Text

- Chat
- Streaming
- Structured Output
- Function Calling

### Image

- Generation
- Editing
- Vision

### Audio

- Speech-to-Text
- Text-to-Speech

### Video

- Generation
- Processing

### AI Engineering

- Agents
- RAG
- Embeddings
- Vector Database
- MCP
- Prompt Engineering
- AI SDK

---

## CMS

- Payload CMS
- Sanity
- Strapi
- Headless CMS
- MDX

---

## Web3

- Wallet Connection
- Sign In With Ethereum
- NFT
- Smart Contracts
- Tokens

---

## Maps

- Leaflet
- Mapbox
- Google Maps
- Clustering
- Heatmaps
- Geolocation

---

## Performance

- Memoization
- Virtualization
- React Compiler
- Suspense
- Lazy Loading
- Streaming
- Bundle Analysis
- Image Optimization
- Code Splitting
- Partial Prerendering

Every optimization includes:

- Before
- After
- FPS
- Render Time
- Memory Usage

---

## Architecture

- Repository Pattern
- Service Layer
- Dependency Injection
- CQRS
- Event Driven
- Modular Design
- Feature-based Architecture

---

## Microfrontends

- Module Federation
- Independent Deployment
- Shared Packages
- Remote Components

---

## Security

- XSS
- CSRF
- SQL Injection
- Rate Limiting
- CSP
- Secrets Management

---

## Testing

- Unit Testing
- Integration Testing
- E2E Testing
- API Testing
- Component Testing
- Contract Testing

---

## DevOps

- Docker
- Docker Compose
- CI/CD
- GitHub Actions
- Deployments
- Monitoring
- Logging

---

## Observability

- Logging
- Tracing
- Metrics
- Health Checks

---

# Tech Stack

## Monorepo

- Turborepo
- Bun Workspaces

---

## Frontend

- React
- Next.js (App Router)
- TypeScript ^6
- Tailwind CSS
- TanStack Query
- React Hook Form
- MDX

---

## Backend

- Elysia
- Next.js Route Handlers
- Shared Typed Contracts
- Zod
- OpenAPI (optional)

---

## Database

- PostgreSQL
- Prisma ORM

---

## Authentication

- Better Auth

Implemented as a reusable package that can be consumed by:

- Next.js Route Handlers
- Elysia Server

---

## Caching

- Redis

---

## Realtime

Choose whichever best fits the feature:

- Native WebSockets
- Elysia WebSocket
- Socket.IO

---

## Validation

- Zod

Shared between:

- Frontend
- Backend
- Database
- API

---

## Data Fetching

- TanStack Query

---

## Testing

- Vitest or Bun Test Runner
- React Testing Library
- Playwright
- Cypress

---

## Documentation

- MDX
- Mermaid
- Markdown

---

## Tooling

- Biome (linter and formatter)
- Husky
- lint-staged
- Turbo
- Bun

---

## Deployment

Frontend

- Vercel

Backend

- Fly.io
- Railway
- Docker

Database

- PostgreSQL

Cache

- Redis

---

# Repository Structure

```
.
├── apps
│   ├── web                # Next.js application
│   ├── api                # Standalone Elysia server
│   └── docs               # Optional documentation app
│
├── packages
│   ├── auth
│   ├── contracts
│   ├── database
│   ├── ui
│   ├── config
│   ├── env
│   ├── logger
│   ├── cache
│   ├── websocket
│   ├── validation
│   ├── hooks
│   ├── utils
│   ├── types
│   ├── biome-config
│   └── tsconfig
│
├── docker
├── scripts
├── examples
└── .github
```

---

# Feature Structure

```
feature/

├── components
├── hooks
├── services
├── repositories
├── api
├── schemas
├── validators
├── types
├── utils
├── constants
├── tests
├── docs
└── demo
```

Every feature follows the same structure.

---

# Architecture

```
                 Browser

                    │

                    ▼

             Next.js (React)

                    │

        TanStack Query / Server Actions

                    │

        ┌──────────────────────────┐
        │                          │
        ▼                          ▼

Next.js Route Handlers       Elysia Server

        │                          │

        └──────────────┬───────────┘

                       ▼

              Shared Contracts

                  (Zod)

                       ▼

                 Service Layer

                       ▼

               Repository Layer

                       ▼

                    Prisma

                       ▼

                 PostgreSQL

                       │

                     Redis

                       │

                  External APIs
```

---

# Development Modes

ZomLab supports multiple development modes.

## Option 1

Only Next.js

```
bun dev
```

Uses:

- Next.js
- Route Handlers

---

## Option 2

Next.js + Embedded Elysia

```
bun dev:elysia
```

Elysia is mounted inside the Next.js application.

---

## Option 3

Standalone API

```
bun dev:standalone
```

Runs:

- Next.js
- Standalone Elysia

Useful for microservice-style development.

---

## Option 4

API Only

```
bun dev:api
```

Runs only Elysia.

---

# Why Elysia?

Some features work perfectly as Route Handlers.

Others benefit from a dedicated API:

- WebSockets
- AI Streaming
- Long-running requests
- Background jobs
- Webhooks
- Better performance

This project supports both approaches.

---

# Documentation

Each module includes:

- Overview
- Live Demo
- Folder Structure
- Architecture Diagram
- Request Flow
- Database Schema
- API Reference
- Performance Notes
- Security Notes
- Common Pitfalls
- References

---

# Coding Principles

- Feature-first architecture
- Shared contracts
- End-to-end type safety
- Reusable packages
- Small modules
- Clean code
- SOLID
- DRY
- KISS
- Progressive enhancement
- Accessibility first
- Performance first

---

# Future Ideas

- Event Bus
- Kafka
- RabbitMQ
- GraphQL
- tRPC Comparison
- gRPC
- Elasticsearch
- OpenTelemetry
- AI Agents
- Vector Databases
- Terraform
- Kubernetes
- CDN
- Cloud Storage
- Feature Flags
- Multi-tenancy
- Offline Support
- PWA
- React Native
- Electron
- Browser Extensions

---

# License

MIT

---

> _"Build once. Learn forever."_
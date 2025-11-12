## Order Service

### Architectural Overview

- Purpose: Owns the lifecycle of customer orders (creation, retrieval, status updates).
- Interface: Exposes a REST API behind the edge router at the base path `/api/orders`.
- Runtime:
  - Internal service port: `3002`
  - Routed by Traefik to `order-service` using a `PathPrefix` rule and `StripPrefix` middleware.
  - Local entrypoint via the router: `http://localhost:8000/api/orders`.
- Tech stack:
  - Node.js with NestJS 11 (TypeScript)
  - TypeORM for data access
  - PostgreSQL as the system of record
- Data:
  - Database-per-service pattern. This service owns its data.
  - Default local database: `order` on the `postgres-order` container.
  - Compose mapping: host `5433` → container `5432`.
- Configuration:
  - Managed via Nest `@nestjs/config` and environment variables (see the `env/` directory and `docker-compose.yaml`).
- Deployment:
  - Containerized service on the shared `microservices-net` network.
  - Independently deployable and horizontally scalable.
- Boundaries and interactions:
  - Provides order-centric REST endpoints.
  - No shared database access. If user or product information is needed, communicate over HTTP with those services.
- Observability:
  - Uses the standard NestJS logger. Extend with metrics/tracing as needed.

### Request routing (Traefik)

- Router rule: requests with path prefix `/api/orders` are forwarded to the service.
- Middleware: the prefix is stripped before reaching the Nest application.

### Local development

- Run via Compose to bring up the service and its PostgreSQL dependency:
  - `order-service` listens on `3002` inside the container and is hot-reloaded in dev.
  - Database container: `postgres-order` (database `order`, default credentials `postgres/postgres` for local).

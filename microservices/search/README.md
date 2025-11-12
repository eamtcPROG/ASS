## Search Service

### Architectural Overview

- Purpose: Exposes search endpoints to query domain data (e.g., products or orders) using structured filters.
- Interface: REST API behind the edge router at the base path `/api/search`.
- Runtime:
  - Internal service port: `3003`
  - Routed by Traefik to `search-service` using a `PathPrefix` rule and `StripPrefix` middleware.
  - Local entrypoint via the router: `http://localhost:8000/api/search`.
- Tech stack:
  - Node.js with NestJS 11 (TypeScript)
  - TypeORM for data access
  - PostgreSQL as the persistence layer (stores searchable projections/state)
- Data:
  - Database-per-service pattern. This service owns its data.
  - Default local database: `search` on the `postgres-search` container.
  - Compose mapping: host `5435` → container `5432`.
- Configuration:
  - Managed via Nest `@nestjs/config` and environment variables (see the `env/` directory and `docker-compose.yaml`).
- Deployment:
  - Containerized service on the shared `microservices-net` network.
  - Independently deployable and horizontally scalable.
- Boundaries and interactions:
  - Provides search-centric REST endpoints.
  - No shared database access; cross-service data should be synchronized or queried over HTTP as needed.
- Observability:
  - Uses the standard NestJS logger. Extend with metrics/tracing as needed.

### Request routing (Traefik)

- Router rule: requests with path prefix `/api/search` are forwarded to the service.
- Middleware: the prefix is stripped before reaching the Nest application.

### Local development

- Run via Compose to bring up the service and its PostgreSQL dependency:
  - `search-service` listens on `3003` inside the container and is hot-reloaded in dev.
  - Database container: `postgres-search` (database `search`, default credentials `postgres/postgres` for local).


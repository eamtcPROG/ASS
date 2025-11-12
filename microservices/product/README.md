## Product Service

### Architectural Overview

- Purpose: Owns the product catalog (definitions, attributes, availability).
- Interface: Exposes a REST API behind the edge router at the base path `/api/products`.
- Runtime:
  - Internal service port: `3004`
  - Routed by Traefik to `product-service` using a `PathPrefix` rule and `StripPrefix` middleware.
  - Local entrypoint via the router: `http://localhost:8000/api/products`.
- Tech stack:
  - Node.js with NestJS 11 (TypeScript)
  - TypeORM for data access
  - PostgreSQL as the system of record
- Data:
  - Database-per-service pattern. This service owns its data.
  - Default local database: `product` on the `postgres-product` container.
  - Compose mapping: host `5434` → container `5432`.
- Configuration:
  - Managed via Nest `@nestjs/config` and environment variables (see the `env/` directory and `docker-compose.yaml`).
- Deployment:
  - Containerized service on the shared `microservices-net` network.
  - Independently deployable and horizontally scalable.
- Boundaries and interactions:
  - Provides product-centric REST endpoints.
  - No shared database access; other services query this one over HTTP if they need product data.
- Observability:
  - Uses the standard NestJS logger. Extend with metrics/tracing as needed.

### Request routing (Traefik)

- Router rule: requests with path prefix `/api/products` are forwarded to the service.
- Middleware: the prefix is stripped before reaching the Nest application.

### Local development

- Run via Compose to bring up the service and its PostgreSQL dependency:
  - `product-service` listens on `3004` inside the container and is hot-reloaded in dev.
  - Database container: `postgres-product` (database `product`, default credentials `postgres/postgres` for local).


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

- From the `microservices/` folder:
  ```bash
  cd ../
  docker compose up -d
  ```
  - Router entrypoint: `http://localhost:8000/api/search`
  - Swagger UI: `http://localhost:8000/api/search/api`
  - Service port (direct): `http://localhost:3003`
  - Database: `postgres-search` (db `search` on `localhost:5435`, creds `postgres/postgres`)
  - RabbitMQ: `amqp://localhost:5672`

### Environment variables
Managed via `@nestjs/config` (`src/config/configuration.ts`):
- `PORT` (service HTTP port, default 3000 if unset in code)
- `NODE_ENV`, `VERSION`
- Database: `DATABASE_HOST`, `DATABASE_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
- Messaging: `RABBITMQ_URI`

When running with Compose, set these in the service environment or rely on container networking (e.g., `DATABASE_HOST=postgres-search`, `RABBITMQ_URI=amqp://rabbitmq:5672`).

### Example requests
```bash
# Search products
curl -sS "http://localhost:8000/api/search/?q=phone&page=1&onpage=10"
```


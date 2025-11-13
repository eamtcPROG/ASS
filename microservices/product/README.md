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

- From the `microservices/` folder:
  ```bash
  cd ../
  docker compose up -d
  ```
  - Router entrypoint: `http://localhost:8000/api/products`
  - Swagger UI: `http://localhost:8000/api/products/api`
  - Service port (direct): `http://localhost:3004`
  - Database: `postgres-product` (db `product` on `localhost:5434`, creds `postgres/postgres`)
  - RabbitMQ: `amqp://localhost:5672`

### Environment variables
Managed via `@nestjs/config` (`src/config/configuration.ts`):
- `PORT` (service HTTP port, default 3000 if unset in code)
- `NODE_ENV`, `VERSION`
- Database: `DATABASE_HOST`, `DATABASE_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
- Messaging: `RABBITMQ_URI`

When running with Compose, set these in the service environment or rely on container networking (e.g., `DATABASE_HOST=postgres-product`, `RABBITMQ_URI=amqp://rabbitmq:5672`).

### Example requests
```bash
# Add a product (requires Bearer token)
curl -sS -X POST http://localhost:8000/api/products/ \
  -H "authorization: Bearer <JWT>" \
  -H 'content-type: application/json' \
  -d '{"name":"Phone","price":799,"description":"Flagship device"}'
```


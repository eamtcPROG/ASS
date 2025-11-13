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

- From the `microservices/` folder:
  ```bash
  cd ../
  docker compose up -d
  ```
  - Router entrypoint: `http://localhost:8000/api/orders`
  - Swagger UI: `http://localhost:8000/api/orders/api`
  - Service port (direct): `http://localhost:3002`
  - Database: `postgres-order` (db `order` on `localhost:5433`, creds `postgres/postgres`)
  - RabbitMQ: `amqp://localhost:5672`

### Environment variables
Managed via `@nestjs/config` (`src/config/configuration.ts`):
- `PORT` (service HTTP port, default 3000 if unset in code)
- `NODE_ENV`, `VERSION`
- Database: `DATABASE_HOST`, `DATABASE_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
- Messaging: `RABBITMQ_URI`

When running with Compose, set these in the service environment or rely on container networking (e.g., `DATABASE_HOST=postgres-order`, `RABBITMQ_URI=amqp://rabbitmq:5672`).

### Example requests
```bash
# Place an order
curl -sS -X POST http://localhost:8000/api/orders/ \
  -H 'content-type: application/json' \
  -d '{"idproduct":1}'

# Pay an order
curl -sS -X POST http://localhost:8000/api/orders/pay/1 \
  -H 'content-type: application/json' \
  -d '{"amount":100}'

# Cancel an order
curl -sS http://localhost:8000/api/orders/cancel/1
```

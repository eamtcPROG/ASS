## User Service

### Architectural Overview

- Purpose: Owns user identity and authentication for the platform (registration, login, profile).
- Interface: Exposes a REST API behind the edge router at the base path `/api/users`.
- Runtime:
  - Internal service port: `3001`
  - Routed by Traefik to `user-service` using a `PathPrefix` rule and `StripPrefix` middleware.
  - Local entrypoint via the router: `http://localhost:8000/api/users`.
- Tech stack:
  - Node.js with NestJS 11 (TypeScript)
  - TypeORM for data access
  - PostgreSQL as the system of record
  - Authentication via `@nestjs/jwt` and `passport` strategies with `bcrypt` password hashing
- Data:
  - Database-per-service pattern. This service owns its data.
  - Default local database: `user` on the `postgres-user` container.
  - Compose mapping: host `5432` → container `5432`.
- Configuration:
  - Managed via Nest `@nestjs/config` and environment variables (see the `env/` directory and `docker-compose.yaml`).
  - Typical variables include database host/port/name/user/password and JWT settings.
- Deployment:
  - Containerized service participating in the shared `microservices-net` network.
  - Independently deployable and horizontally scalable without coupling to other services.
- Boundaries and interactions:
  - Provides user- and auth-centric REST endpoints only.
  - No direct database sharing; other services call this service over HTTP if they need user/auth context.
- Observability:
  - Uses the standard NestJS logger. Extend with metrics/tracing as needed.

### Request routing (Traefik)

- Router rule: requests with path prefix `/api/users` are forwarded to the service.
- Middleware: the prefix is stripped before reaching the Nest application.

### Local development

- From the `microservices/` folder:
  ```bash
  cd ../
  docker compose up -d
  ```
  - Router entrypoint: `http://localhost:8000/api/users`
  - Swagger UI: `http://localhost:8000/api/users/api`
  - Service port (direct): `http://localhost:3001`
  - Database: `postgres-user` (db `user` on `localhost:5432`, creds `postgres/postgres`)
  - RabbitMQ: `amqp://localhost:5672`

### Environment variables
Managed via `@nestjs/config` (`src/config/configuration.ts`):
- `PORT` (service HTTP port, default 3000 if unset in code)
- `NODE_ENV`, `VERSION`
- Database: `DATABASE_HOST`, `DATABASE_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- JWT: `JWT_SECRET`, `JWT_EXPIRES_IN`
- Messaging: `RABBITMQ_URI`

When running with Compose, set these in the service environment or rely on container networking (e.g., `DATABASE_HOST=postgres-user`, `RABBITMQ_URI=amqp://rabbitmq:5672`).

### Example requests

```bash
# Sign up
curl -sS -X POST http://localhost:8000/api/users/sign-up \
  -H 'content-type: application/json' \
  -d '{"email":"alice@example.com","password":"secret"}'

# Sign in (returns JWT)
curl -sS -X POST http://localhost:8000/api/users/sign-in \
  -H 'content-type: application/json' \
  -d '{"email":"alice@example.com","password":"secret"}'

# List users (requires Bearer token)
curl -sS http://localhost:8000/api/users/ \
  -H "authorization: Bearer <JWT>"
```


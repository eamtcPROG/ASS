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

- Run via Compose to bring up the service and its PostgreSQL dependency:
  - `user-service` listens on `3001` inside the container and is hot-reloaded in dev.
  - Database container: `postgres-user` (database `user`, default credentials `postgres/postgres` for local).


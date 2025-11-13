## Market (Monolith)

### Overview
This is a monolithic NestJS application that implements the marketplace domain:
- `user` module: authentication and identity
- `product` module: product catalog
- `order` module: order lifecycle (place, pay, cancel)
- `search` module: querying products

Cross-cutting `app/` layer provides DTOs, interceptors, filters, constants, and utilities. Swagger documentation is enabled.

### Tech stack
- Node.js with NestJS 11 (TypeScript)
- TypeORM
- PostgreSQL (via local Docker compose)
- JWT auth (via `@nestjs/jwt`)

### Local development

Start PostgreSQL (first time only):
```bash
docker compose up -d
```

Install and run the app:
```bash
npm install
PORT=3000 npm run start:dev
```

Swagger UI:
```
http://localhost:3000/api
```

### Configuration
Configuration is provided via environment variables and `@nestjs/config`. Key variables:
- `PORT` (required by the app)
- `NODE_ENV`, `VERSION`
- Database: `DATABASE_HOST`, `DATABASE_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- Auth: `JWT_SECRET`, `JWT_EXPIRES_IN`

Reference: `src/config/configuration.ts`

### Project structure
- `src/app/*`: cross-cutting concerns (DTOs, interceptors, filters, constants)
- `src/user`, `src/product`, `src/order`, `src/search`: feature modules
- `src/main.ts`: bootstrap and Swagger setup

### Scripts
```bash
npm run start        # production
npm run start:dev    # watch mode
npm run start:prod   # compiled production
npm run test         # unit tests
npm run test:e2e     # e2e tests
npm run test:cov     # coverage
```

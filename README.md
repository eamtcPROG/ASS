# ASS

## Overview

This repository contains a NestJS/TypeScript implementation of a marketplace system, provided in two architectural styles:
- a monolithic application under `monolithic/market`
- a set of domain-aligned microservices under `microservices/` (`user`, `product`, `order`, `search`)

### Repository layout
- `monolithic/market`: Single NestJS app with feature modules for `user`, `product`, `order`, `search`, plus shared `app/` layer (DTOs, interceptors, filters, constants, tools) and `config/`.
- `microservices/`: Individual NestJS services for `user`, `product`, `order`, and `search`, each with its own `src/`, `Dockerfile`, `env/`, and runtime configs. A `docker-compose.yaml` is available at `microservices/`.
- `reports/`: High-level module and architecture notes (`report_monolithic.md`, `report_*_module.md`).
- `README.md`: High-level project documentation (this file).

### Domain modules (monolithic example under `monolithic/market/src`)
- `user`:
  - Auth and identity: `jwt.strategy.ts`, `jwt.guard.ts`, `auth.service.ts`, `user.service.ts`
  - Convenience: `current-user.decorator.ts`, `current-user.interceptor.ts`
- `product`:
  - HTTP API: `product.controller.ts` (JWT-protected, Swagger-annotated)
  - Business logic: `product.service.ts` (TypeORM repository-backed)
  - Data contracts: `add-product.dto.ts`, `product.dto.ts`
  - Model: `product.model.ts`
  - Status constants: `app/constants/product-status.ts`
- `order`:
  - Business logic: `order.service.ts` orchestrates product reservation/sale and order lifecycle (place, pay, cancel) using `OrderStatus`
  - Data contracts: `order.dto.ts`, `place-order.dto.ts`, `pay-order.dto.ts`
  - Model: `order.model.ts`
- `search`:
  - Cached product search: `search.service.ts` uses `@nestjs/cache-manager` and delegates to `ProductService`
  - Module wiring: `search.module.ts` imports `ProductModule`

### Cross-cutting (monolithic `app/` layer)
- DTOs: `list.dto.ts`, `message.dto.ts`, `resultlist.dto.ts`, `resultobject.dto.ts`
- Interceptors: `global-response.interceptor.ts`, `global-errors.interceptor.ts`
- Error handling: `global-exception.filter.ts`
- Constants: `order-status.ts`, `product-status.ts`
- Utilities: `tools/common.tools.ts` (e.g., timestamps)
- Config: `config/configuration.ts`
- Entry: `main.ts`, root `app.module.ts`

### Data and persistence
- TypeORM repositories are injected via `@nestjs/typeorm`.
- Entities live under each module’s `models/` directory (e.g., `product.model.ts`, `order.model.ts`, `user.model.ts`).
- Services encapsulate database access and enforce invariants (e.g., product reservation on order placement).

### API and documentation
- Swagger decorators (`@nestjs/swagger`) annotate controllers and DTOs for API docs.
- Auth is enforced via `JwtGuard` and documented via `@ApiBearerAuth('jwt')`.

### Microservices
- Each service mirrors the monolithic module boundaries, enabling independent deployment.
- Common patterns: DTOs, interceptors, filters, and TypeORM usage per service.
- Each service includes `Dockerfile`, `env/`, `nest-cli.json`, and tests.

### Notable flows
- Place order:
  - Validate product availability via `ProductService.getProduct`
  - Create order and reserve product (`ProductService.reserveProduct`)
- Pay order:
  - Accumulate payments; on full payment, mark order paid and product sold
- Cancel order:
  - Mark order cancelled and release product

This structure supports learning, comparison, and evolution between monolith and microservices while keeping domain logic consistent across both.
## Monolithic Architecture Report

### Overview
This project is a NestJS-based monolith composed of feature modules (`user`, `product`, `order`, `search`) wired together in a single deployable application. It uses TypeORM with PostgreSQL for persistence, JWT for authentication, Swagger-annotated DTOs for API contracts, global interceptors for error/response shaping, and cache-manager for performance.

### Architecture
- **Core composition (AppModule)**: Centralizes configuration, database, cache, and feature modules.

```20:49:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/app/app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${process.cwd()}/env/.env.${process.env.NODE_ENV}`,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: 'postgres',
          host: config.get<string>('database.host'),
          port: config.get<number>('database.port'),
          username: config.get<string>('database.username'),
          password: config.get<string>('database.password'),
          database: config.get<string>('database.database'),
          synchronize: true,
          entities: [User, Product, Order],
        };
      },
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 6000000, // 1 hour
    }),
    UserModule,
    ProductModule,
    OrderModule,
    SearchModule,
  ],
```

- **Global cross-cutting concerns**: Error and response interceptors applied globally.

```52:60:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/app/app.module.ts
providers: [
  AppService,
  {
    provide: APP_INTERCEPTOR,
    useClass: GlobalErrorsInterceptor,
  },
  {
    provide: APP_INTERCEPTOR,
    useClass: GlobalResponseInterceptor,
  },
],
```

- **Authentication and current user**: JWT configured from config, strategy/guard pattern, and a current-user interceptor made global in the user module.

```16:24:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/user/user.module.ts
JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    secret: config.get<string>('jwt.secret'),
    signOptions: {
      expiresIn: config.get<number>('jwt.expires_in'),
    },
  }),
  inject: [ConfigService],
}),
```

```10:19:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/user/guards/jwt.guard.ts
canActivate(
  context: ExecutionContext,
): Promise<boolean> | boolean | Observable<boolean> {
  const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
    context.getHandler(),
    context.getClass(),
  ]);
  if (isPublic) return true;
  return super.canActivate(context);
}
```

- **Persistence and domain modeling**: Enums centralize lifecycle states; DTOs standardize pagination.

```1:5:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/app/constants/product-status.ts
export enum ProductStatus {
  ACTIVE = 1,
  RESERVED = 2,
  SOLD = 3,
}
```

```1:5:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/app/constants/order-status.ts
export enum OrderStatus {
  PENDING = 1,
  PAID = 2,
  CANCELLED = 3,
}
```

```12:15:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/app/dto/list.dto.ts
static skip(page: number, onPage: number) {
  return (page - 1) * (onPage ?? 10);
}
```

- **Module interaction**: Modules remain cohesive yet integrate via direct service imports (e.g., orders depend on products for availability and state transitions).

```8:12:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/order/order.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Order]), ProductModule],
  controllers: [OrderController],
  providers: [OrderService],
})
```

- **Search and caching**: Search orchestrates product listing with text filters and caches results to improve responsiveness and reduce DB load.

```14:23:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/search/service/search.service.ts
async search(page: number, onpage: number, query: string) {
  const key = `search:${page}:${onpage}:${query}`;
  const cached = await this.cacheManager.get(key);
  if (cached) {
    return cached as ListDto<ProductDto>;
  }
  const products = await this.service.getList(page, onpage, query);
  await this.cacheManager.set(key, products);
  return products;
}
```

- **Filtering approach**: Product listing supports substring search in `name` and `description` while enforcing ACTIVE status.

```20:27:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/product/services/product.service.ts
const [products, total] = await this.repo.findAndCount({
  skip: ListDto.skip(page, onPage),
  take: onPage,
  where: [
    { status: ProductStatus.ACTIVE, name: Like(`%${search}%`) },
    { status: ProductStatus.ACTIVE, description: Like(`%${search}%`) },
  ],
});
```

### Module Responsibilities
- **User**: Registration, sign-in, JWT issuance/validation, current user resolution.
- **Product**: CRUD-lite (list/create) and status transitions (ACTIVE → RESERVED → SOLD).
- **Order**: Place/pay/cancel orders with product state coordination and ownership checks.
- **Search**: Public search over products with result caching.

### Cross-Cutting Concerns
- **Configuration**: Global `ConfigModule` with environment-based configuration.
- **Database**: TypeORM with PostgreSQL; entities registered centrally in `AppModule`.
- **Authentication**: JWT via Passport strategy and guard; `@Public()` support through metadata.
- **Interceptors**: Global error handling and response shaping; current-user interceptor inside the user module.
- **Swagger**: DTOs and controllers annotated for discoverability and strong API docs.
- **Caching**: Global cache-manager; used by search to key responses by pagination and query.

### Advantages
- **Simplicity of deployment**: Single build and deploy artifact; fewer moving parts.
- **Strong modular boundaries**: Nest modules encapsulate controllers/services/entities, enabling clear ownership.
- **Shared code and types**: DTOs/enums reused across modules reduce duplication and drift.
- **Consistent cross-cutting policies**: Global interceptors and config deliver uniform error/response behavior.
- **Transaction-friendly**: Single process and database simplify data consistency and ordering operations.
- **Performance wins with caching**: Cache-layer in search reduces database pressure on repeated queries.
- **Developer productivity**: Centralized project structure speeds onboarding and changes across features.

### Disadvantages
- **Scaling constraints**: Horizontal scaling replicates the entire app; cannot independently scale hot paths (e.g., search) without scaling everything.
- **Coupling through direct imports**: Cross-module service calls (e.g., orders → products) create tight coupling and reduce isolation for evolution/testing.
- **Deployment blast radius**: Any change requires redeploying the whole application; failures impact all modules.
- **Shared runtime contention**: Heavy workloads in one area (e.g., batch jobs, spike in orders) can impact latency in others.
- **Limited technology heterogeneity**: Single stack and database reduce flexibility (e.g., specialized storage per module).
- **Cache coherence complexity**: Cached search results can become stale; invalidation requires extra care on product changes.

### Notes and Opportunities
- **Bounded contexts**: Keep modules cohesive; consider explicit interfaces for cross-module interactions to loosen coupling.
- **Cache strategy**: Add TTL tuning and invalidation hooks on product mutations to minimize stale reads in search.
- **Observability**: Standardize request tracing/metrics per module to isolate hotspots within the monolith.
- **Read/write separation**: If read load grows, consider query replicas or CQRS-like read services while staying monolithic.
- **Future extraction**: The current modular design can serve as a foundation for gradual extraction (e.g., `search` or `order`) if needed later.



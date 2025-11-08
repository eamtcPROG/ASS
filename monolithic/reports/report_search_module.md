## Search Module Report

### Overview
The `@search` module exposes a public, paginated product search endpoint. It delegates filtering to the `@product` module and caches responses using Nest's cache-manager to improve performance on repeated queries.

### Architecture
- **Module wiring**: Imports `ProductModule` to reuse `ProductService`, and wires controller and service.

```6:12:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/search/search.module.ts
@Module({
  imports: [ProductModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [],
})
export class SearchModule {}
```

- **Service and caching**: `SearchService` injects `Cache` and `ProductService`. It builds a cache key from `page`, `onpage`, and `query`, returns cached `ListDto<ProductDto>` when available, otherwise fetches from `ProductService.getList(...)`, caches, and returns the result.

```9:12:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/search/service/search.service.ts
constructor(
  @Inject(CACHE_MANAGER) private cacheManager: Cache,
  private readonly service: ProductService,
) {}
```

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

- **DTOs and API contracts**: Uses shared DTOs `ListDto<ProductDto>` and `ResultListDto<ProductDto>` from the app and product modules. No search-specific DTOs/entities are defined.

### Controller and endpoints
- Public search endpoint with optional pagination (`page`, `onpage`) and query (`q`). Swagger annotations document the API.

```18:33:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/search/controllers/search.controller.ts
@ApiOperation({ summary: 'Get a list of products' })
@ApiConsumes('application/json')
@ApiOkResponse({
  type: ResultListDto<ProductDto>,
  description: 'List of products',
})
@ApiQuery({ name: 'page', type: Number, required: false })
@ApiQuery({ name: 'onpage', type: Number, required: false })
@Get('/')
getList(
  @Query('page') page?: number,
  @Query('onpage') onpage?: number,
  @Query('q') query?: string,
) {
  return this.service.search(page ?? 1, onpage ?? 10, query ?? '');
}
```

### Request Flows
- **Search products**:
  1. Controller reads `page`, `onpage`, and `q` (defaults: 1, 10, empty string).
  2. `SearchService.search` checks cache by key `search:${page}:${onpage}:${query}`.
  3. On cache miss, delegates to `ProductService.getList(page, onpage, query)` which filters by name/description and active status, then caches and returns the `ListDto<ProductDto>`.

### Security Considerations
- Search endpoint is public (no `JwtGuard`), returning only product DTOs.
- Caching is key-scoped per page/size/query; default TTL applies unless configured elsewhere.

### Architectural Approach
- **Layered design**: Controller → Search service → Product service; DTOs shared across modules.
- **Performance via caching**: Response caching reduces load for repeated searches.
- **Module composition**: Leverages `ProductModule` for filtering and pagination logic; keeps search layer thin and focused on orchestration and caching.



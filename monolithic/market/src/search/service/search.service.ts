import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ListDto } from 'src/app/dto/list.dto';
import { ProductDto } from 'src/product/dto/product.dto';
import { ProductService } from 'src/product/services/product.service';

@Injectable()
export class SearchService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly service: ProductService,
  ) {}

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
}

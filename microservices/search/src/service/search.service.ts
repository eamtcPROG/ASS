import { Injectable } from '@nestjs/common';
import { ProductService } from './product.service';

@Injectable()
export class SearchService {
  constructor(private readonly service: ProductService) {}

  async search(page: number, onpage: number, query: string) {
    // console.log(page, onpage, query);
    // return new ListDto<any>([], 0, onpage);
    // const key = `search:${page}:${onpage}:${query}`;
    // const cached = await this.cacheManager.get(key);
    // if (cached) {
    //   return cached as ListDto<ProductDto>;
    // }
    const products = await this.service.getList(page, onpage, query);
    // await this.cacheManager.set(key, products);
    return products;
  }
}

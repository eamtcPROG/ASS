import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../models/product.model';
import { ListDto } from 'src/app/dto/list.dto';
import { ProductDto } from '../dto/product.dto';
import { Status } from 'src/app/constants/status';
import { User } from 'src/user/models/user.model';
import { AddProductDto } from '../dto/add-product.dto';

@Injectable()
export class ProductService {
  constructor(@InjectRepository(Product) private repo: Repository<Product>) {}

  async getList(page: number, onPage: number): Promise<ListDto<ProductDto>> {
    const [products, total] = await this.repo.findAndCount({
      skip: ListDto.skip(page, onPage),
      take: onPage,
      where: { status: Status.ACTIVE },
    });
    const objects = products.map((product) => ProductDto.fromEntity(product));
    return new ListDto<ProductDto>(objects, total, onPage);
  }

  async addProduct(object: AddProductDto, user: User): Promise<ProductDto> {
    const product = this.repo.create(object);
    product.user = user;
    return ProductDto.fromEntity(await this.repo.save(product));
  }
}

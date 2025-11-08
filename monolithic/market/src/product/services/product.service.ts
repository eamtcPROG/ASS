import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Product } from '../models/product.model';
import { ListDto } from 'src/app/dto/list.dto';
import { ProductDto } from '../dto/product.dto';
import { ProductStatus } from 'src/app/constants/product-status';
import { User } from 'src/user/models/user.model';
import { AddProductDto } from '../dto/add-product.dto';

@Injectable()
export class ProductService {
  constructor(@InjectRepository(Product) private repo: Repository<Product>) {}

  async getList(
    page: number,
    onPage: number,
    search: string = '',
  ): Promise<ListDto<ProductDto>> {
    const [products, total] = await this.repo.findAndCount({
      skip: ListDto.skip(page, onPage),
      take: onPage,
      where: [
        { status: ProductStatus.ACTIVE, name: Like(`%${search}%`) },
        { status: ProductStatus.ACTIVE, description: Like(`%${search}%`) },
      ],
    });
    const objects = products.map((product) => ProductDto.fromEntity(product));
    return new ListDto<ProductDto>(objects, total, onPage);
  }

  async addProduct(object: AddProductDto, user: User): Promise<ProductDto> {
    const product = this.repo.create(object);
    product.user = user;
    return ProductDto.fromEntity(await this.repo.save(product));
  }

  async updateStatus(id: number, status: number): Promise<void> {
    await this.repo.update(id, { status });
  }

  async reserveProduct(id: number): Promise<void> {
    const product = await this.repo.findOne({
      where: { id, status: ProductStatus.ACTIVE },
    });
    if (!product) {
      throw new BadRequestException('Product not available');
    }

    await this.updateStatus(id, ProductStatus.RESERVED);
  }

  async sellProduct(id: number): Promise<void> {
    await this.updateStatus(id, ProductStatus.SOLD);
  }

  async getProduct(id: number): Promise<Product | null> {
    const product = await this.repo.findOne({
      where: { id, status: ProductStatus.ACTIVE },
    });

    return product;
  }

  async releaseProduct(id: number): Promise<void> {
    await this.updateStatus(id, ProductStatus.ACTIVE);
  }
}

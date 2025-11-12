import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from 'src/models/product.model';
import { ProductStatus } from 'src/constants/product-status';

@Injectable()
export class ProductService {
  constructor(@InjectRepository(Product) private repo: Repository<Product>) {}

  getProduct(id: number): Promise<Product | null> {
    return this.repo.findOne({ where: { id } });
  }

  async createProduct(
    id: number,
    name: string,
    price: number,
  ): Promise<Product> {
    const product = this.repo.create({ id, name, price });
    return await this.repo.save(product);
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

  async releaseProduct(id: number): Promise<void> {
    await this.updateStatus(id, ProductStatus.ACTIVE);
  }
}

## Product Module Report

### Overview
The `@product` module provides product listing, creation, and status transitions (reserve/sell). It follows NestJS conventions with clear separation across controller, service, DTOs, and persistence (TypeORM entity/repository). Protected routes use JWT via a guard from the user module.

### Architecture
- **Module wiring**: Registers the `Product` entity repository and wires controller and service.

```7:12:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/product/produc.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
```

- **Entity and persistence**: `Product` entity includes core fields and relational link to `User`. Default `status` is `ACTIVE`.

```5:24:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/product/models/product.model.ts
@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  price: number;

  @Column()
  description: string;

  @Column({ default: Status.ACTIVE })
  status: number;

  @ManyToOne(() => User, (user) => user.products)
  user: User;
}
```

```1:6:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/app/constants/status.ts
export enum Status {
  ACTIVE = 1,
  RESERVED = 2,
  SOLD = 3,
}
```

```11:23:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/product/services/product.service.ts
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
```

```25:29:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/product/services/product.service.ts
  async addProduct(object: AddProductDto, user: User): Promise<ProductDto> {
    const product = this.repo.create(object);
    product.user = user;
    return ProductDto.fromEntity(await this.repo.save(product));
  }
```

```31:33:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/product/services/product.service.ts
  async updateStatus(id: number, status: number): Promise<void> {
    await this.repo.update(id, { status });
  }
```

```35:44:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/product/services/product.service.ts
  async reserveProduct(id: number): Promise<void> {
    const product = await this.repo.findOne({
      where: { id, status: Status.ACTIVE },
    });
    if (!product) {
      throw new BadRequestException('Product not available');
    }

    await this.updateStatus(id, Status.RESERVED);
  }
```

```46:48:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/product/services/product.service.ts
  async sellProduct(id: number): Promise<void> {
    await this.updateStatus(id, Status.SOLD);
  }
}
```

- **DTOs and API contracts**: Output uses `ProductDto`; creation uses `AddProductDto`.

```4:48:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/product/dto/product.dto.ts
export class ProductDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the product',
    type: 'number',
  })
  id: number;

  @ApiProperty({
    example: 'Product name',
    description: 'Product name',
    type: 'string',
  })
  name: string;

  @ApiProperty({
    example: 100,
    description: 'Product price',
    type: 'number',
  })
  price: number;

  @ApiProperty({
    example: 'Product description',
    description: 'Product description',
    type: 'string',
  })
  description: string;

  constructor(id: number, name: string, price: number, description: string) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.description = description;
  }

  static fromEntity(entity: Product): ProductDto {
    return new ProductDto(
      entity.id,
      entity.name,
      entity.price,
      entity.description,
    );
  }
}
```

```3:22:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/product/dto/add-product.dto.ts
export class AddProductDto {
  @ApiProperty({
    example: 'Product name',
    description: 'Product name',
    type: 'string',
  })
  name: string;
  @ApiProperty({
    example: 100,
    description: 'Product price',
    type: 'number',
  })
  price: number;
  @ApiProperty({
    example: 'Product description',
    description: 'Product description',
    type: 'string',
  })
  description: string;
}
```

- **Controller and endpoints**: Public listing; protected creation with `JwtGuard`. All routes are annotated for Swagger.

```34:45:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/product/controllers/product.controller.ts
  @ApiOperation({ summary: 'Get a list of products' })
  @ApiConsumes('application/json')
  @ApiOkResponse({
    type: ResultListDto<ProductDto>,
    description: 'List of products',
  })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'onpage', type: Number, required: false })
  @Get('/')
  getList(@Query('page') page?: number, @Query('onpage') onpage?: number) {
    return this.service.getList(page ?? 1, onpage ?? 10);
  }
```

```47:66:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/product/controllers/product.controller.ts
  @ApiOperation({ summary: 'Add a product' })
  @ApiConsumes('application/json')
  @ApiOkResponse({
    type: ProductDto,
    description: 'Product',
  })
  @ApiBody({ type: AddProductDto })
  @UseGuards(JwtGuard)
  @ApiBearerAuth('jwt')
  @ApiBadRequestResponse({
    type: ResultObjectDto<null>,
    description: 'Name, price and description are required',
  })
  @Post('/')
  addProduct(@Body() body: AddProductDto, @CurrentUser() user: User) {
    if (!body.name || !body.price || !body.description) {
      throw new BadRequestException('Name, price and description are required');
    }
    return this.service.addProduct(body, user);
  }
```

### Request Flows
- **List products**:
  1. Controller accepts optional `page` and `onpage` query params (defaults 1/10).
  2. `ProductService.getList` paginates active products and maps to `ProductDto`.

- **Add product**:
  1. Controller validates required `name`, `price`, `description`.
  2. `JwtGuard` ensures caller is authenticated (`@ApiBearerAuth('jwt')`).
  3. `ProductService.addProduct` creates and persists, associating current user.

- **Status transitions**:
  1. `reserveProduct` checks availability (`Status.ACTIVE`) and updates to `RESERVED`.
  2. `sellProduct` updates status to `SOLD`.

### Security Considerations
- `@UseGuards(JwtGuard)` protects creation; only authenticated users can add products.
- Business rule: Reservation validates availability to prevent updating non-active products.
- Minimal exposure in DTOs; entity-to-DTO mapping avoids leaking internal fields.

### Architectural Approach
- **Layered design**: Controller → Service → Repository/Entity; DTOs define API contracts separate from persistence.
- **Swagger-first**: Endpoints and DTOs are annotated for discoverability and docs.
- **Composability**: Guard from user module secures mutation endpoints; status enum centralizes lifecycle states.



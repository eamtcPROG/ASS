import { Module } from '@nestjs/common';
import { SearchService } from './service/search.service';
import { SearchController } from './controllers/search.controller';
import { ProductModule } from 'src/product/produc.module';

@Module({
  imports: [ProductModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [],
})
export class SearchModule {}

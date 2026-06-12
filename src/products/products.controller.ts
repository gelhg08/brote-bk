import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryProductsDto } from './dto/query-products.dto';
import {
  ProductListResponse,
  ProductResponse,
} from './entities/product.entity';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  /** GET /api/v1/products — lista paginada con filtros (?category=&search=&page=&limit=). */
  @Get()
  findAll(@Query() query: QueryProductsDto): Promise<ProductListResponse> {
    return this.products.findAll(query);
  }

  /** GET /api/v1/products/:slug — detalle por slug. */
  @Get(':slug')
  findOne(@Param('slug') slug: string): Promise<ProductResponse> {
    return this.products.findBySlug(slug);
  }
}

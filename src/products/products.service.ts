import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryProductsDto } from './dto/query-products.dto';
import {
  ProductListResponse,
  ProductResponse,
  toProductResponse,
} from './entities/product.entity';

/** Campos expuestos por la API (payload acotado: sin columnas internas). */
const PRODUCT_SELECT = {
  slug: true,
  name: true,
  shortDescription: true,
  material: true,
  priceBeforeTax: true,
  active: true,
  category: { select: { slug: true, name: true } },
  variants: { select: { sku: true, color: true, hex: true, stock: true } },
} satisfies Prisma.ProductSelect;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lista paginada (offset) con filtros opcionales por categoría y búsqueda por nombre. */
  async findAll(query: QueryProductsDto): Promise<ProductListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ProductWhereInput = {
      active: true,
      ...(query.category ? { category: { slug: query.category } } : {}),
      ...(query.search ? { name: { contains: query.search } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        select: PRODUCT_SELECT,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: items.map(toProductResponse),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Detalle por slug. 404 si no existe. */
  async findBySlug(slug: string): Promise<ProductResponse> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      select: PRODUCT_SELECT,
    });
    if (!product) {
      throw new NotFoundException(`Producto no encontrado: ${slug}`);
    }
    return toProductResponse(product);
  }

  /** Lista por categoría. 404 si la categoría no existe. */
  async findByCategory(
    categorySlug: string,
    query: QueryProductsDto,
  ): Promise<ProductListResponse> {
    const category = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true },
    });
    if (!category) {
      throw new NotFoundException(`Categoría no encontrada: ${categorySlug}`);
    }
    return this.findAll({ ...query, category: categorySlug });
  }
}

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';

const dbProduct = {
  slug: 'mug-clasico',
  name: 'Mug Clásico',
  shortDescription: '14 oz / 400 ml',
  material: 'Cerámica',
  priceBeforeTax: 2_100_000,
  active: true,
  category: { slug: 'mugs', name: 'Mugs' },
  variants: [{ sku: 'B435', color: null, hex: null, stock: 50 }],
};

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    product: { findMany: jest.Mock; count: jest.Mock; findUnique: jest.Mock };
    category: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      product: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn() },
      category: { findUnique: jest.fn() },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  describe('findAll', () => {
    it('devuelve data mapeada (con priceWithTax) y meta de paginación', async () => {
      prisma.$transaction.mockResolvedValue([[dbProduct], 1]);

      const res = await service.findAll({ page: 1, limit: 20 });

      expect(res.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
      expect(res.data).toHaveLength(1);
      expect(res.data[0].priceBeforeTax).toBe(2_100_000);
      expect(res.data[0].priceWithTax).toBe(2_499_000); // 2.100.000 * 1.19
      expect(res.data[0].variants[0].sku).toBe('B435');
    });

    it('aplica filtros de categoría y búsqueda en el where', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({
        category: 'mugs',
        search: 'clasico',
        page: 2,
        limit: 10,
      });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            active: true,
            category: { slug: 'mugs' },
            name: { contains: 'clasico' },
          },
          skip: 10, // (page-1)*limit
          take: 10,
        }),
      );
    });

    it('totalPages = 0 cuando no hay resultados', async () => {
      prisma.$transaction.mockResolvedValue([[], 0]);
      const res = await service.findAll({ page: 1, limit: 20 });
      expect(res.meta.totalPages).toBe(0);
    });
  });

  describe('findBySlug', () => {
    it('devuelve el producto cuando existe', async () => {
      prisma.product.findUnique.mockResolvedValue(dbProduct);
      const res = await service.findBySlug('mug-clasico');
      expect(res.slug).toBe('mug-clasico');
      expect(res.priceWithTax).toBe(2_499_000);
    });

    it('lanza NotFound cuando no existe', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.findBySlug('inexistente')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findByCategory', () => {
    it('lanza NotFound si la categoría no existe', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      await expect(
        service.findByCategory('no-existe', {}),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('delega en findAll cuando la categoría existe', async () => {
      prisma.category.findUnique.mockResolvedValue({ id: 1 });
      prisma.$transaction.mockResolvedValue([[dbProduct], 1]);

      const res = await service.findByCategory('mugs', { page: 1, limit: 20 });

      expect(res.data).toHaveLength(1);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { active: true, category: { slug: 'mugs' } },
        }),
      );
    });
  });
});

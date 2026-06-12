import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';
import { integritySignature } from './wompi.utils';

const SECRET = 'test_integrity_SEED';
const PUBLIC_KEY = 'pub_test_X';
const FRONTEND = 'http://localhost:3001';

function baseDto(quantity = 2) {
  return {
    items: [{ productSlug: 'mug-clasico', variantSku: 'B435', quantity }],
    customerName: 'Ana Pérez',
    customerEmail: 'ana@example.com',
    shippingAddress: 'Calle 1 # 2-3',
    shippingCity: 'Medellín',
  };
}

function variant(stock: number, priceBeforeTax = 2_100_000) {
  return {
    sku: 'B435',
    productSlug: 'mug-clasico',
    stock,
    product: {
      slug: 'mug-clasico',
      name: 'Mug Clásico',
      active: true,
      priceBeforeTax,
    },
  };
}

describe('OrdersService', () => {
  let service: OrdersService;
  let tx: {
    productVariant: { findUnique: jest.Mock; updateMany: jest.Mock };
    order: { findUnique: jest.Mock; create: jest.Mock };
  };
  let prisma: { $transaction: jest.Mock; order: { findUnique: jest.Mock } };

  beforeEach(async () => {
    tx = {
      productVariant: { findUnique: jest.fn(), updateMany: jest.fn() },
      order: { findUnique: jest.fn(), create: jest.fn() },
    };
    prisma = {
      $transaction: jest
        .fn()
        .mockImplementation((cb: (t: typeof tx) => unknown) => cb(tx)),
      order: { findUnique: jest.fn() },
    };

    // defaults para el camino feliz
    tx.order.findUnique.mockResolvedValue(null); // referencia única
    tx.productVariant.updateMany.mockResolvedValue({ count: 1 });
    tx.order.create.mockImplementation(
      ({
        data,
      }: {
        data: Record<string, unknown> & {
          items: {
            create: {
              productSlug: string;
              variantSku: string;
              quantity: number;
              priceBeforeTax: number;
            }[];
          };
        };
      }) => ({
        id: 1,
        reference: data.reference,
        status: 'PENDING',
        totalInCents: data.totalInCents,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone ?? null,
        customerDocument: data.customerDocument ?? null,
        shippingAddress: data.shippingAddress,
        shippingCity: data.shippingCity,
        shippingState: data.shippingState ?? null,
        shippingNotes: data.shippingNotes ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: data.items.create.map((it) => ({
          ...it,
          product: { name: 'Mug Clásico' },
        })),
        payment: null,
      }),
    );

    const config = {
      get: jest.fn(
        (k: string) =>
          ({
            WOMPI_INTEGRITY_SECRET: SECRET,
            WOMPI_PUBLIC_KEY: PUBLIC_KEY,
            FRONTEND_ORIGIN: FRONTEND,
          })[k],
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  describe('create', () => {
    it('crea la orden recalculando el total (IVA 19%) + envío $13.000', async () => {
      tx.productVariant.findUnique.mockResolvedValue(variant(50));

      const res = await service.create(baseDto(2)); // subtotal 4.200.000 (< 120k)

      // round(4.200.000 * 1.19) + 1.300.000 = 4.998.000 + 1.300.000
      expect(res.totalInCents).toBe(6_298_000);
      expect(res.items[0].productName).toBe('Mug Clásico');
      expect(res.items[0].priceBeforeTax).toBe(2_100_000);
    });

    it('envío gratis si el subtotal (sin IVA) >= $120.000', async () => {
      tx.productVariant.findUnique.mockResolvedValue(variant(50));

      const res = await service.create(baseDto(6)); // subtotal 12.600.000 (>= 120k)

      // round(12.600.000 * 1.19) + 0
      expect(res.totalInCents).toBe(14_994_000);
    });

    it('lanza 404 si el producto/variante no existe', async () => {
      tx.productVariant.findUnique.mockResolvedValue(null);
      await expect(service.create(baseDto())).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lanza 400 si el stock es insuficiente', async () => {
      tx.productVariant.findUnique.mockResolvedValue(variant(1)); // pide 2, hay 1
      await expect(service.create(baseDto(2))).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('lanza 400 si el stock cambia durante la transacción (concurrencia)', async () => {
      tx.productVariant.findUnique.mockResolvedValue(variant(50)); // validación OK
      tx.productVariant.updateMany.mockResolvedValue({ count: 0 }); // pero el decremento no afecta filas
      await expect(service.create(baseDto(2))).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('genera referencia única que empieza con "BR-" y firma de integridad SHA-256 válida', async () => {
      tx.productVariant.findUnique.mockResolvedValue(variant(50));

      const res = await service.create(baseDto(2));

      expect(res.reference).toMatch(/^BR-[0-9A-F]+$/);
      expect(tx.order.findUnique).toHaveBeenCalled(); // verificó unicidad
      // la firma coincide con el algoritmo verificado de Wompi
      const expected = integritySignature(
        res.reference,
        res.totalInCents,
        'COP',
        SECRET,
      );
      expect(res.wompiConfig.integritySignature).toBe(expected);
      expect(res.wompiConfig.integritySignature).toMatch(/^[a-f0-9]{64}$/);
      expect(res.wompiConfig.amountInCents).toBe(res.totalInCents);
      expect(res.wompiConfig.publicKey).toBe(PUBLIC_KEY);
    });
  });

  describe('findById', () => {
    it('devuelve la orden con items', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 7,
        reference: 'BR-ABC123',
        status: 'PENDING',
        totalInCents: 6_298_000,
        customerName: 'Ana',
        customerEmail: 'ana@example.com',
        customerPhone: null,
        customerDocument: null,
        shippingAddress: 'Calle 1',
        shippingCity: 'Medellín',
        shippingState: null,
        shippingNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [
          {
            productSlug: 'mug-clasico',
            variantSku: 'B435',
            quantity: 2,
            priceBeforeTax: 2_100_000,
            product: { name: 'Mug Clásico' },
          },
        ],
        payment: null,
      });

      const res = await service.findById(7);
      expect(res.id).toBe(7);
      expect(res.items).toHaveLength(1);
      expect(res.wompiConfig.reference).toBe('BR-ABC123');
    });

    it('lanza 404 si la orden no existe', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});

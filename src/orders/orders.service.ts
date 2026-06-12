import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  OrderResponse,
  WompiConfig,
  toOrderResponse,
} from './dto/order-response.dto';
import { integritySignature } from './wompi.utils';

const IVA_RATE = 0.19;
const CURRENCY = 'COP';
const SHIPPING_CENTS = 1_300_000; // $13.000 a ciudades principales
const FREE_SHIPPING_THRESHOLD_CENTS = 12_000_000; // subtotal sin IVA >= $120.000 → envío gratis

const ORDER_INCLUDE = {
  items: { include: { product: { select: { name: true } } } },
  payment: true,
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Crea una orden de invitado de forma ATÓMICA:
   * valida productos/variantes y stock, recalcula el total en el servidor (nunca confía en el
   * cliente), descuenta stock con condición anti-overselling, genera referencia única y la firma
   * de integridad de Wompi. Todo dentro de una transacción Prisma.
   */
  async create(dto: CreateOrderDto): Promise<OrderResponse> {
    const order = await this.prisma.$transaction(async (tx) => {
      // a + b) validar cada producto/variante y su stock; acumular subtotal
      let subtotalCents = 0;
      const lines: {
        productSlug: string;
        variantSku: string;
        quantity: number;
        priceBeforeTax: number;
      }[] = [];

      for (const item of dto.items) {
        const variant = await tx.productVariant.findUnique({
          where: { sku: item.variantSku },
          include: {
            product: {
              select: {
                slug: true,
                name: true,
                active: true,
                priceBeforeTax: true,
              },
            },
          },
        });

        if (
          !variant ||
          variant.productSlug !== item.productSlug ||
          !variant.product.active
        ) {
          throw new NotFoundException(
            `Producto o variante no encontrado: ${item.productSlug} / ${item.variantSku}`,
          );
        }
        if (variant.stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para ${variant.product.name} (${variant.sku})`,
          );
        }

        subtotalCents += variant.product.priceBeforeTax * item.quantity;
        lines.push({
          productSlug: item.productSlug,
          variantSku: item.variantSku,
          quantity: item.quantity,
          priceBeforeTax: variant.product.priceBeforeTax,
        });
      }

      // c) total recalculado en servidor: (subtotal con IVA) + envío
      const shippingCents =
        subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_CENTS;
      const totalInCents =
        Math.round(subtotalCents * (1 + IVA_RATE)) + shippingCents;

      // d) referencia única
      const reference = await this.generateUniqueReference(tx);

      // e) descontar stock atómicamente (anti-overselling / concurrencia)
      for (const line of lines) {
        const res = await tx.productVariant.updateMany({
          where: { sku: line.variantSku, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (res.count === 0) {
          throw new BadRequestException(
            `Stock insuficiente para ${line.variantSku} (cambió durante la compra)`,
          );
        }
      }

      // f) crear la orden PENDING con snapshot de precios
      return tx.order.create({
        data: {
          reference,
          totalInCents,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone ?? null,
          customerDocument: dto.customerDocument ?? null,
          shippingAddress: dto.shippingAddress,
          shippingCity: dto.shippingCity,
          shippingState: dto.shippingState ?? null,
          shippingNotes: dto.shippingNotes ?? null,
          items: {
            create: lines.map((l) => ({
              productSlug: l.productSlug,
              variantSku: l.variantSku,
              quantity: l.quantity,
              priceBeforeTax: l.priceBeforeTax,
            })),
          },
        },
        include: ORDER_INCLUDE,
      });
    });

    // g + h) firma de integridad + respuesta con wompiConfig
    return toOrderResponse(
      order,
      this.buildWompiConfig(order.reference, order.totalInCents),
    );
  }

  async findById(id: number): Promise<OrderResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    if (!order) throw new NotFoundException(`Orden no encontrada: ${id}`);
    return toOrderResponse(
      order,
      this.buildWompiConfig(order.reference, order.totalInCents),
    );
  }

  async findByReference(reference: string): Promise<OrderResponse> {
    const order = await this.prisma.order.findUnique({
      where: { reference },
      include: ORDER_INCLUDE,
    });
    if (!order)
      throw new NotFoundException(`Orden no encontrada: ${reference}`);
    return toOrderResponse(
      order,
      this.buildWompiConfig(order.reference, order.totalInCents),
    );
  }

  /** Referencia única por orden, no reutilizable: "BR-" + timestamp hex + aleatorio. */
  private async generateUniqueReference(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const reference = `BR-${Date.now().toString(16).toUpperCase()}${randomBytes(
        3,
      )
        .toString('hex')
        .toUpperCase()}`;
      const existing = await tx.order.findUnique({
        where: { reference },
        select: { id: true },
      });
      if (!existing) return reference;
    }
    throw new Error('No se pudo generar una referencia única para la orden');
  }

  private buildWompiConfig(
    reference: string,
    amountInCents: number,
  ): WompiConfig {
    const integritySecret =
      this.config.get<string>('WOMPI_INTEGRITY_SECRET') ?? '';
    const publicKey = this.config.get<string>('WOMPI_PUBLIC_KEY') ?? '';
    const frontendOrigin = this.config.get<string>('FRONTEND_ORIGIN') ?? '';
    return {
      publicKey,
      currency: CURRENCY,
      amountInCents,
      reference,
      integritySignature: integritySignature(
        reference,
        amountInCents,
        CURRENCY,
        integritySecret,
      ),
      redirectUrl: `${frontendOrigin}/confirmacion`,
    };
  }
}

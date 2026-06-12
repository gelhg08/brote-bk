/** Config que el frontend necesita para abrir el Widget de Wompi. */
export interface WompiConfig {
  publicKey: string;
  currency: string;
  amountInCents: number;
  reference: string;
  integritySignature: string;
  redirectUrl: string;
}

export interface OrderItemResponse {
  productSlug: string;
  productName: string;
  variantSku: string;
  quantity: number;
  priceBeforeTax: number; // snapshot al momento de compra (centavos sin IVA)
}

export interface OrderResponse {
  id: number;
  reference: string;
  status: string;
  totalInCents: number; // total con IVA + envío (recalculado en servidor)
  customer: {
    name: string;
    email: string;
    phone: string | null;
    document: string | null;
  };
  shipping: {
    address: string;
    city: string;
    state: string | null;
    notes: string | null;
  };
  items: OrderItemResponse[];
  createdAt: Date;
  updatedAt: Date;
  wompiConfig: WompiConfig;
}

/** Forma de la orden tal como la devuelve Prisma con los includes del servicio. */
export interface OrderWithItems {
  id: number;
  reference: string;
  status: string;
  totalInCents: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerDocument: string | null;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string | null;
  shippingNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: {
    productSlug: string;
    variantSku: string;
    quantity: number;
    priceBeforeTax: number;
    product: { name: string };
  }[];
}

export function toOrderResponse(
  order: OrderWithItems,
  wompiConfig: WompiConfig,
): OrderResponse {
  return {
    id: order.id,
    reference: order.reference,
    status: order.status,
    totalInCents: order.totalInCents,
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      document: order.customerDocument,
    },
    shipping: {
      address: order.shippingAddress,
      city: order.shippingCity,
      state: order.shippingState,
      notes: order.shippingNotes,
    },
    items: order.items.map((it) => ({
      productSlug: it.productSlug,
      productName: it.product.name,
      variantSku: it.variantSku,
      quantity: it.quantity,
      priceBeforeTax: it.priceBeforeTax,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    wompiConfig,
  };
}

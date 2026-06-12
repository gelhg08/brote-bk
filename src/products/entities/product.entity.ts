/** IVA Colombia. El precio en BD es `priceBeforeTax`; aquí derivamos el precio con IVA. */
export const IVA_RATE = 0.19;

export interface ProductVariantResponse {
  sku: string;
  color: string | null;
  hex: string | null;
  stock: number;
}

export interface ProductResponse {
  slug: string;
  name: string;
  category: { slug: string; name: string };
  priceBeforeTax: number; // centavos COP sin IVA
  priceWithTax: number; // centavos COP con IVA (derivado)
  material: string | null;
  shortDescription: string | null;
  active: boolean;
  variants: ProductVariantResponse[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductListResponse {
  data: ProductResponse[];
  meta: PaginationMeta;
}

/** Forma que devuelve Prisma con el select del servicio. */
export interface ProductWithRelations {
  slug: string;
  name: string;
  shortDescription: string | null;
  material: string | null;
  priceBeforeTax: number;
  active: boolean;
  category: { slug: string; name: string };
  variants: ProductVariantResponse[];
}

export function priceWithTax(priceBeforeTax: number): number {
  return Math.round(priceBeforeTax * (1 + IVA_RATE));
}

export function toProductResponse(p: ProductWithRelations): ProductResponse {
  return {
    slug: p.slug,
    name: p.name,
    category: p.category,
    priceBeforeTax: p.priceBeforeTax,
    priceWithTax: priceWithTax(p.priceBeforeTax),
    material: p.material,
    shortDescription: p.shortDescription,
    active: p.active,
    variants: p.variants,
  };
}

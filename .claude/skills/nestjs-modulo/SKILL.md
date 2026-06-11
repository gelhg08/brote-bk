---
name: nestjs-modulo
description: Convención para crear un módulo de dominio NestJS en Brote (products, orders, payments) — estructura controller/service/module/dto/entities/spec, validación con class-validator, formato de error {code,message,details}, uso de Prisma y tests. Úsalo al crear o modificar cualquier módulo del backend.
---

# Módulo de dominio NestJS (Brote)

Stack: NestJS v11 (Node 20+) · Prisma · MySQL. **Un módulo por dominio**, autocontenido. No romper la estructura.

## Estructura de un módulo

```
src/<dominio>/
├── dto/
│   ├── create-<x>.dto.ts        # class-validator + class-transformer
│   └── update-<x>.dto.ts
├── entities/
│   └── <x>.entity.ts            # tipo/representación de salida (sin filtrar campos internos)
├── <dominio>.controller.ts      # rutas, sin lógica de negocio
├── <dominio>.service.ts         # lógica + acceso vía PrismaService
├── <dominio>.module.ts
└── <dominio>.service.spec.ts    # unit test (mock de PrismaService y de clientes externos)
```

## Reglas

- **Validación estricta**: todo input pasa por un DTO con `class-validator`. `ValidationPipe` global con
  `whitelist:true`, `forbidNonWhitelisted:true`, `transform:true`.
- **Errores**: filtro global → `{ code, message, details }`. **Nunca** stack traces ni secretos al cliente.
- **Prisma**: inyecta `PrismaService` (módulo `@Global`). Usa `select`/`include` con criterio (evita N+1 y
  payloads gordos). Paginación **cursor** para listados (catálogo). Índices y `@unique` definidos en el schema.
- **Dinero**: `Int` en centavos (ver CLAUDE.md). Total con IVA recalculado en servidor.
- **Pagos/stock**: operaciones críticas dentro de `prisma.$transaction`; descuento de stock atómico
  (`update` con `where: { stock: { gte: qty } }`) para evitar overselling.
- **Tests obligatorios** por módulo (Regla #2): unit (servicio con mocks) y, para flujos críticos, e2e
  con `supertest`. Pagos → contra mocks (skill `wompi-mocking`).

## DTO (ejemplo)

```ts
import { IsString, IsInt, IsPositive, MaxLength, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString() @MaxLength(120) name!: string;
  @IsString() @MaxLength(140) slug!: string;
  @IsInt() @IsPositive() priceBeforeTax!: number; // centavos COP sin IVA
  @IsInt() categoryId!: number;
  @IsOptional() @IsString() shortDescription?: string;
}
```

## Service con Prisma (ejemplo de patrón)

```ts
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findCatalog(cursor?: number, take = 20) {
    return this.prisma.product.findMany({
      where: { active: true },
      select: { slug: true, name: true, priceBeforeTax: true, variants: { select: { color: true, hex: true, stock: true } } },
      orderBy: { id: 'asc' },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
  }
}
```

## Antes de cerrar

- Pasa lint + tests localmente (el hook de Stop lo exige). · Valida la arquitectura (agente
  `guardian-arquitectura`), seguridad (`revisor-seguridad`) y performance (`revisor-performance`).
- Respeta el **contrato de API** (CLAUDE.md / PROYECTO.md §5) que el frontend ya mockeó.

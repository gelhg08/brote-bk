# PROYECTO — Brote · Tienda de productos ecológicos

> **Documento maestro / fuente de verdad.** Versión: 2.0 · Última actualización: 2026-06-10
>
> **Cómo usar este documento:**
> - **Claude Code**: vive en `docs/PROYECTO.md` del repo. Claude Code lo lee del disco automáticamente
>   (el `CLAUDE.md` de la raíz le dice que lo consulte). No necesitas pasarlo manualmente.
> - **Claude.ai** (chat web): súbelo al inicio de cada conversación nueva (no tiene memoria entre sesiones).
> - Al final de cada sesión, pide actualizar este documento y guarda la nueva versión.

---

## 1. Resumen del proyecto

Tienda online de productos ecológicos reutilizables (termos, bolsas, mugs, pocillos, stickers, cubiertos)
para el mercado colombiano. Marca: **Brote**.

- **Misión:** reducir el consumo de productos de un solo uso con alternativas asequibles, prácticas y fáciles
  de integrar a la vida diaria.
- **Mercado:** Colombia (precios en COP, IVA 19%).
- **Modelo de compra:** sin registro obligatorio (checkout como invitado). Auth con Cognito/Amplify en fase posterior.

---

## 2. Stack tecnológico

| Capa | Tecnología | Estado |
|---|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind v4 | ✅ Completo |
| Estado cliente | Zustand (persist en localStorage) | ✅ Completo |
| Testing frontend | Vitest 4 + React Testing Library + MSW 2.x + Playwright (config) | ✅ 34 tests |
| Backend | NestJS + Prisma + MySQL | 🔜 Fase 3 |
| Pagos | Wompi (Widget & Checkout Web, sandbox) | 🔜 Fase 3 |
| Auth (posterior) | AWS Cognito + Amplify | ⬜ Fase 5 |
| Hosting | Por decidir (Vercel frontend / Railway o AWS backend) | ⬜ Pendiente |

---

## 3. Identidad de marca

- **Nombre:** Brote
- **Paleta Marea:**
  - Primario: `#1F8A82` · Profundo: `#14534E` · Fondo: `#F5F3EE` · Texto: `#2B2B2B` · Acento: `#E9A178`
  - Derivados: Muted `#5E6E6B` · Subtle `#8A9794` · Teal-light `#E3EDEB` · Footer `#103F3B` · Footer-link `#A9C6C2`
- **Tipografía:** Hanken Grotesk (400/500/600/700) via `next/font/google`
- **Tono:** cercano, honesto, sin "greenwashing", educativo

---

## 4. Sistema de diseño (implementado)

Tokens definidos en `app/globals.css` con `@theme` de Tailwind v4:
- Colores: `bg-primary`, `text-deep`, `bg-surface`, `text-accent`, `bg-teal-light`, `bg-footer`, `text-footer-link`
- Radios: `rounded-md` (8px) botones/inputs, `rounded-lg` (12px) cards, `rounded-xl` (14px) contenedores
- Bordes: `border-deep/12` (estándar sutil)
- Botón primario: `bg-deep text-surface rounded-md px-5 py-3 text-sm font-semibold`
- Botón secundario: `border border-deep text-deep rounded-md px-5 py-3 text-sm font-semibold bg-transparent`
- Sombras: mínimas, solo `shadow-md` en hover de cards

### Componentes implementados
- `ProductCard` — imagen, categoría (eyebrow), nombre, dots de color, precio con IVA. Reutilizado en Home, Catálogo, Categoría y Producto (relacionados).
- `Header` — logo + nav + search + carrito con badge (Zustand). Sticky. Menú hamburguesa en móvil.
- `Footer` — 4 columnas (marca, tienda, ayuda, contacto) sobre `bg-footer`.
- `CartItem` — thumbnail + info + stepper + precio + eliminar.
- `OrderSummary` — subtotal + IVA + envío + total + CTA.
- `FilterSidebar` — categoría (checks), color (swatches), precio (rango). Drawer en móvil.
- `MobileNav` — drawer lateral con nav + carrito.
- `ConfirmationContent` — 3 estados (aprobado/rechazado/pendiente).

### Utilidades
- `lib/format.ts` → `formatCOP()` — formato COP sin decimales, separador de miles con punto.
- `lib/products.ts` — datos mock (8 productos, 6 categorías). Se reemplazará por fetch a la API.

### Convención de precios
- En BD/API: `priceBeforeTax` (entero, COP sin IVA).
- IVA = 19%. Precio final = `priceBeforeTax * 1.19`.
- A Wompi: monto final en **centavos** (precio final × 100).
- En UI: precio con IVA como principal; "antes de IVA" como secundario.

---

## 5. Arquitectura

```
[Next.js frontend]  --REST-->  [NestJS API]  -->  [MySQL (Prisma)]
   (eco-ft)                    (brote-backend)
      |                             |
   Zustand                    Wompi webhooks
   (carrito)                  (firma en servidor)
      |                             |
  localStorage               S3/Cloudinary (imágenes, futuro)
```

### Repos
- **`eco-ft`** (frontend) — GitHub: `gelhg08/eco-ft` — ✅ Completo (6 PRs mergeados)
- **`brote-backend`** (backend) — GitHub: `gelhg08/brote-backend` — 🔜 Por configurar

### Contrato de API (definido por los handlers MSW del frontend)
- `GET /api/v1/products` — lista de productos
- `GET /api/v1/products/:slug` — producto por slug
- `POST /api/v1/orders` — crear orden → `{ orderId, reference, totalInCents, integritySignature }`
- `GET /api/v1/orders/:id` — estado de la orden
- `POST /api/v1/webhooks/wompi` — webhook de transacción

### Checkout y pagos (Wompi)

Flujo:
1. Carrito en frontend (Zustand) → 2. Datos de envío (invitado).
3. Backend crea orden en `PENDIENTE` con **referencia única** (no reutilizable).
4. Backend genera **firma de integridad** (hash con secreto, distinto de llave privada).
5. Frontend abre Widget Wompi (monto en centavos, referencia, firma) → pago.
6. **Webhook** confirma: backend verifica firma → `PAGADA` / `RECHAZADA`. **Fuente de verdad.**
7. Orden pagada → correo + guía de envío.
8. Frontend muestra confirmación por `transaction_id`.

Reglas (no negociables):
- Backend recalcula total; **nunca** confía en monto del cliente.
- Montos en **centavos**. Total **ya incluye IVA**.
- Firma de integridad **solo en servidor**.
- Webhook = fuente de verdad; redirect = solo UX.
- Tabla `payments` con `transaction_id` para auditoría.
- **Sandbox primero** (`pub_test_`, tarjetas `4242…`=APPROVED, `4111…`=DECLINED).

### Modelo de datos

**Products:**
- `slug`, `name`, `category` (FK), `shortDescription`, `material`
- `priceBeforeTax` (COP sin IVA)
- `variants[]`: `color`, `hex`, `stock` (inventario por variante)
- `tags[]`, `images[]`, `active`

**Categories:** termos · mugs · pocillos · bolsas · cubiertos · stickers

**Orders:** `id`, `reference` (única), `status` (PENDING/PAID/DECLINED/VOIDED), `totalInCents`,
`customerEmail`, `customerPhone`, `customerName`, `customerDocument`, `shippingAddress`, `shippingCity`,
`shippingState`, `shippingNotes`, `createdAt`, `updatedAt`

**OrderItems:** `orderId` (FK), `productSlug`, `variantColor`, `quantity`, `priceBeforeTax`

**Payments:** `id`, `orderId` (FK), `transactionId` (Wompi), `status`, `amountInCents`, `method`,
`integritySignature`, `rawWebhookPayload`, `createdAt`

---

## 6. Frontend — completado (Fase 2) ✅

### Páginas implementadas
| Ruta | Página | PR |
|---|---|---|
| `/` | Home (hero, categorías, destacados, propuesta de valor, pasos) | #1 |
| `/catalogo` | Catálogo con filtros (categoría, color, precio) en URL params | #2 |
| `/catalogo/[categoria]` | Vista filtrada por categoría | #2 |
| `/producto/[slug]` | Detalle con variantes, galería, add to cart | #3 |
| `/carrito` | Carrito editable + resumen con IVA | #4 |
| `/checkout` | Checkout invitado + pago mock (TODO: Wompi real) | #5 |
| `/confirmacion` | 3 estados: aprobado/rechazado/pendiente | #5 |
| `/sobre-nosotros` | Misión, valores, CTA | #6 |
| `/como-comprar` | 3 pasos + FAQ | #6 |
| `/contacto` | Canales + formulario (sin backend) | #6 |
| `/terminos` | Términos y condiciones | #6 |
| `/privacidad` | Política de privacidad (Ley 1581) | #6 |
| `/envios` | Envíos y devoluciones | #6 |

### Testing (34 tests, Vitest + RTL + MSW)
- Cart store: add/remove/update/clear/selectores/IVA
- Componentes: ProductCard, CartItem, OrderSummary
- Integración: Catálogo (lista/filtro/vacío), Confirmación (3 estados)
- MSW handlers: contrato del backend mockeado (5 endpoints + error variants)

### Pendientes frontend (para cuando exista el backend)
- Reemplazar datos mock (`lib/products.ts`) por fetch real a la API
- Integrar widget real de Wompi (reemplazar mock que simula y redirige)
- Loading states / skeletons
- SEO metadata por página (parcialmente hecho)
- Playwright e2e specs

---

## 7. Roadmap

- **Fase 0 — Fundación:** ✅ identidad, paleta, tipografía, tokens.
- **Fase 1 — UX/UI:** ✅ sitemap, flujo checkout, wireframes de todas las pantallas.
- **Fase 2 — Frontend:** ✅ Next.js completo (13 páginas, 34 tests, responsive, 6 PRs).
- **Fase 3 — Backend (en curso):** NestJS + Prisma + MySQL + Wompi.
  - Setup + Products (CRUD + seed)
  - Orders (crear orden invitado, referencia, stock, recálculo)
  - Payments (firma integridad, widget config, webhook, idempotencia)
  - Testing (unit + integration, Wompi mockeado)
- **Fase 4 — Integración:** conectar frontend ↔ backend, deploy staging.
- **Fase 5 — Auth:** Cognito/Amplify, cuentas y panel de usuario.

---

## 8. Convenciones para Claude Code

### Git flow (establecido)
- `main` = rama estable, siempre funcional
- Feature branches: `feat/nombre`, `fix/nombre`
- Commits convencionales: `feat:`, `fix:`, `chore:`, `refactor:`, `style:`, `test:`
- Al terminar: tests verdes → push rama → PR a main
- Nunca push directo a main (excepto setup inicial)

### Frontend (Next.js)
- `app/` (rutas con route groups `(shop)` y `(checkout)`) · `components/` · `lib/` · `stores/` · `types/`
- Tokens de Marea, **nunca hex directo** en clases
- `formatCOP()` para todo precio
- `ProductCard` para toda card de producto

### Backend (NestJS) — convenciones a aplicar
- Un módulo por dominio: `products`, `orders`, `payments`
- Cada módulo: `*.controller.ts`, `*.service.ts`, `*.module.ts`, `dto/`, `entities/`
- Filtro global de excepciones: `{ code, message, details }`. Sin stack traces al cliente.
- Validación con DTOs + `class-validator`
- Prisma como ORM. Migraciones versionadas.

### Reglas globales
1. **Investigar antes de decidir** (regla #1): subagentes en paralelo, sintetizar, vigencia 2026
2. **Testing obligatorio** por feature/fix
3. **Arquitectura respetada**: no romper la estructura modular
4. **Performance**: N+1, índices, paginación, payloads
5. **Seguridad**: secretos en .env, firma solo en servidor, webhook verificado, recálculo de totales
6. **Mejores prácticas 2026**
7. **Comandos externos READ-ONLY**

---

## 9. Registro de decisiones

| Fecha | Decisión | Motivo |
|---|---|---|
| 2026-06-04 | Stack: Next.js + Zustand + NestJS + MySQL + Wompi | Definido por el equipo |
| 2026-06-04 | Checkout sin registro en MVP | Reducir fricción |
| 2026-06-04 | Paleta **Marea**, nombre **Brote** | Identidad propia alineada con la misión |
| 2026-06-04 | Wompi: Widget & Checkout Web, webhook = fuente de verdad | e-commerce propio, confiabilidad |
| 2026-06-04 | Firma integridad solo servidor, montos centavos con IVA | Seguridad Wompi |
| 2026-06-04 | Repos separados: `eco-ft` (front) + `brote-backend` (back) | Preferencia del equipo |
| 2026-06-04 | ORM: **Prisma** | Type-safe, buen DX, migraciones |
| 2026-06-04 | Claude Code local por repo (`.claude/`), MCP read-only | Portable vía git |
| 2026-06-04 | Git flow: feature branches + PRs, commits convencionales | Calidad y trazabilidad |
| 2026-06-04 | Tipografía: Hanken Grotesk via next/font | Limpia y cálida |
| 2026-06-05 | Testing frontend: Vitest 4 + RTL + MSW 2.x + Playwright | Investigación regla #1, vigente 2026 |
| 2026-06-05 | Tailwind v4 con `@theme` (no tailwind.config.js) | Next.js 16 default |
| 2026-06-06 | Frontend completo: 13 páginas, 34 tests, responsive, 6 PRs | Fase 2 cerrada |
| 2026-06-10 | Repo `brote-backend` creado. Arranca Fase 3. | Backend por configurar |
| 2026-06-10 | Claude Code configurado en `brote-bk` (`.claude/` versionado): CLAUDE.md, 4 skills, 5 agents, 2 hooks portables (Node), settings.json, .mcp.json read-only | Fase 3 paso 1; investigación Regla #1 (Wompi, NestJS v11, Prisma/MySQL, seguridad pagos, config Claude Code), vigente 2026 |
| 2026-06-10 | Git flow ratificado: feature branch + PR a `main`; `finalizador-feature` exige tests verdes antes de push; setup inicial puede ir directo a `main` | Servicio de pagos: trazabilidad y calidad |
| 2026-06-10 | Hook de seguridad bloquea: Wompi producción (pub_prod_/prv_prod_/prod_*/production.wompi.co), `git push --force`, comandos `aws` mutantes | Reglas #2, #5 y #7 forzadas por el harness |

---

## 10. Estado actual y próximos pasos

**Estado:** Fase 2 (frontend) **cerrada**. Fase 3 (backend) **en curso**.
Repo `brote-bk` creado, clonado y **con Claude Code configurado** (`.claude/` versionado: CLAUDE.md, skills,
agents, hooks, settings, `.mcp.json`). Pendiente: arrancar el scaffold NestJS.

**Próximos pasos:**
1. ~~Configurar Claude Code en `brote-bk`.~~ ✅ Hecho (2026-06-10).
2. Inicializar NestJS + Prisma + MySQL (schema basado en el modelo de datos de §5). **Re-verificar versión de
   Prisma vigente (línea v7 a 2026-06) y de NestJS (v11) antes del scaffold — Regla #1.**
3. Módulo Products: CRUD + seed de los 8 productos placeholder.
4. Módulo Orders: crear orden invitado, referencia única, validar stock, recalcular total.
5. Módulo Payments: firma integridad Wompi, configuración widget, webhook con verificación, idempotencia.
6. Testing: unit + integration con Wompi mockeado (todos los escenarios de §5).
7. Conectar frontend (reemplazar mocks por fetch real + widget Wompi real).
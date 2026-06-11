# CLAUDE.md — Brote Backend (NestJS)

> Memoria de proyecto, siempre activa. Léela completa en cada sesión.
> **Fuente de verdad:** `@docs/PROYECTO.md` (arquitectura, flujo de pago, IVA, decisiones). Consúltala siempre.

@docs/PROYECTO.md

---

## Qué es esto

Backend de **Brote**, tienda de productos ecológicos reutilizables para Colombia (COP, IVA 19%).
Compra **sin cuenta** (checkout invitado). Pasarela **Wompi** (Widget & Checkout Web, sandbox).

**Stack:** NestJS (v11, Node 20+) · Prisma · MySQL · Wompi · (Cognito/Amplify en Fase 5).

**Estado:** Fase 3 (backend). El `.claude/` ya está configurado. El scaffold de NestJS es el siguiente paso.

---

## Reglas globales NO negociables (aplican en CADA turno)

1. **REGLA #1 — Investigar antes de decidir.** Ante cualquier decisión técnica, API, patrón o regla de
   negocio: lanza **varios subagentes de investigación en paralelo** (3–5, ángulos distintos), **sintetiza tú**
   y elige según *nuestro* contexto. Verifica vigencia **2026**. Para Wompi, consulta `docs.wompi.co`, no tu
   memoria. → Usa la skill **`investigacion-paralela`** y el agente **`investigador`**.
2. **Testing local obligatorio.** Toda feature/fix se prueba localmente **antes** de darse por terminada.
   Wompi: **nunca** tocar el entorno real ni usar llaves de producción. Solo **sandbox** + **mocks de todos los
   escenarios**. → Skill **`wompi-mocking`**.
3. **Arquitectura respetada.** Un módulo por dominio (`products`, `orders`, `payments`). No romper la estructura.
   → Skill **`nestjs-modulo`**, agente **`guardian-arquitectura`**.
4. **Performance.** Cuida N+1, índices MySQL, tamaño de payload, paginación y conexiones. → Agente **`revisor-performance`**.
5. **Seguridad.** Sin secretos en el repo (`.env` + `.env.example`). Validación estricta (DTOs + class-validator).
   Firma de integridad Wompi **solo en servidor**. **Webhook = fuente de verdad**, con firma verificada sobre
   *raw body*. El backend **recalcula el total** (nunca confía en el cliente). → Agente **`revisor-seguridad`**.
6. **Mejores prácticas 2026.** Siempre.
7. **Comandos externos READ-ONLY.** Cualquier comando de nube (AWS/Cognito a futuro) debe ser de **solo lectura**
   (`describe`/`list`/`get`). No mutar recursos reales. (Forzado por hook.)

---

## Convención de dinero (crítica)

- En BD/API el precio base es `priceBeforeTax` (entero, COP **sin** IVA).
- **IVA = 19%.** Precio final = `priceBeforeTax * 1.19`.
- A Wompi: monto final **en centavos** (`amount_in_cents`, entero) = precio final con IVA × 100.
- Guarda dinero como `Int` (centavos). **Nunca** `Float`/`Decimal` para montos.
- El total **ya incluye IVA**. El backend lo **recalcula** desde los ítems; no confía en el monto del cliente.

## Wompi — invariantes (detalle en skill `wompi-integracion`)

- **Firma de integridad solo en servidor:** `SHA256(reference + amount_in_cents + currency [+ expiration_time] + integrity_secret)`.
- **Webhook `transaction.updated` = fuente de verdad.** Verifica la firma sobre el **raw body**
  (`SHA256(valores de signature.properties + timestamp + events_secret)`, `signature.properties` es **dinámico**),
  con comparación en tiempo constante. El redirect del front es solo UX.
- **Confirma** el estado real por `GET /v1/transactions/{id}` (sandbox: `https://sandbox.wompi.co/v1`).
- **Referencia única** por orden (no reutilizable). **Idempotencia** por `transactionId` único.
- Estados: `APPROVED` / `DECLINED` / `VOIDED` / `ERROR` (finales) y `PENDING` (transitorio).
- **Antes de tocar pagos**, re-verifica `docs.wompi.co` (Regla #1).

---

## Arquitectura (resumen; ver `@docs/PROYECTO.md` §5)

```
src/
├── products/   { *.controller, *.service, *.module, dto/, entities/, *.spec }
├── orders/
├── payments/   { webhooks/ }   ← raw body + firma + idempotencia
├── prisma/     { prisma.service, prisma.module (@Global) }
├── common/     { filters/ (formato {code,message,details}), guards/, interceptors/ }
└── main.ts     { ValidationPipe global, helmet, CORS, rawBody:true, throttler }
```

Contrato de API (definido por los mocks MSW del frontend — no cambiar sin avisar):
`GET /api/v1/products` · `GET /api/v1/products/:slug` · `POST /api/v1/orders` →
`{ orderId, reference, totalInCents, integritySignature }` · `GET /api/v1/orders/:id` ·
`POST /api/v1/webhooks/wompi`.

---

## Flujo de git (establecido — ver PROYECTO.md §8)

- `main` = estable y siempre funcional. **Nunca** push directo a `main` (excepto el setup inicial del repo).
- Rama por feature: `feat/nombre`, `fix/nombre`. Commits convencionales (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`).
- Al terminar una feature: **tests verdes** → push de la rama → **PR a `main`**. → Agente **`finalizador-feature`**
  (exige pruebas verdes antes de empujar).

---

## Herramientas del harness (`.claude/`)

- **Skills:** `investigacion-paralela`, `wompi-integracion`, `wompi-mocking`, `nestjs-modulo`.
- **Agentes:** `investigador`, `guardian-arquitectura`, `revisor-seguridad`, `revisor-performance`, `finalizador-feature`.
- **Hooks:** guardia de seguridad (bloquea Wompi prod / `push --force` / nube mutante) + lint&tests al cerrar.
- **MCP (read-only, requieren tu aprobación):** ver `.mcp.json` y `.claude/README.md`.

## Cierre de sesión

Actualiza `@docs/PROYECTO.md` (registro de decisiones §9 + estado §10) con lo decidido y el estado real.

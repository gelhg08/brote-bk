---
name: wompi-integracion
description: Reglas verificadas de integración con Wompi (Colombia) para Brote — firma de integridad solo en servidor, montos en centavos con IVA, estados de transacción, verificación de webhook sobre raw body, confirmación por GET /transactions/{id}, idempotencia y tokens de aceptación. Úsalo al implementar o modificar cualquier cosa de pagos. Re-verifica docs.wompi.co antes de codificar.
---

# Wompi — integración (Brote)

> ⚠️ **Antes de tocar pagos, re-verifica `https://docs.wompi.co` (Regla #1).** Lo de abajo está verificado
> a 2026-06 pero el contrato puede cambiar. Solo **sandbox** en desarrollo (el hook bloquea producción).

## Invariantes (no negociables)

- **Montos en centavos** (`amount_in_cents`, entero), moneda `COP`. El total **ya incluye IVA (19%)**.
- **El backend recalcula el total** desde los ítems de la orden. **Nunca** confía en el monto del cliente.
- **Firma de integridad solo en el servidor.** **Webhook = fuente de verdad**; el redirect del front es solo UX.
- **Referencia única** por orden (no reutilizable). **Idempotencia** por `transactionId` (constraint único en BD).

## Llaves y entornos

| Tipo | Sandbox | Producción | Dónde vive |
|---|---|---|---|
| Pública | `pub_test_` | `pub_prod_` | puede ir al frontend |
| Privada | `prv_test_` | `prv_prod_` | **solo servidor** |
| Secreto de eventos (webhook) | `test_events_` | `prod_events_` | **solo servidor** |
| Secreto de integridad | `test_integrity_` | `prod_integrity_` | **solo servidor** |

Base URL sandbox: `https://sandbox.wompi.co/v1` · producción: `https://production.wompi.co/v1`.
Variables en `.env` (`WOMPI_*`); ver `.env.example`. **Jamás** commitear llaves reales.

## Firma de integridad (al crear la orden)

Concatenar **en este orden** y hashear con **SHA256**:

```
reference + amount_in_cents + currency [+ expiration_time] + integrity_secret
```

```ts
import { createHash } from 'node:crypto';

export function integritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integritySecret: string,
  expirationTime?: string, // ISO8601 opcional; si va, se incluye ANTES del secreto
): string {
  const base = `${reference}${amountInCents}${currency}${expirationTime ?? ''}${integritySecret}`;
  return createHash('sha256').update(base).digest('hex');
}
```

El front recibe `{ reference, amountInCents, integritySignature }` y abre el Widget con
`public-key`, `currency=COP`, `amount-in-cents`, `reference`, `signature:integrity`, `redirect-url`, `customer-data`.

## Estados de transacción

`APPROVED` · `DECLINED` · `VOIDED` (solo tarjeta) · `ERROR` → **finales**. `PENDING` → transitorio (PSE/3DS).
Mapeo a la orden: `APPROVED → PAID`, `DECLINED → DECLINED`, `VOIDED → VOIDED`. `ERROR`/`PENDING` no marcan pagada.

## Webhook `transaction.updated` (fuente de verdad)

Verificación correcta (sobre **raw body**, `signature.properties` **dinámico**, tiempo constante):

```ts
import { createHash, timingSafeEqual } from 'node:crypto';

export function isValidWompiEvent(event: any, eventsSecret: string): boolean {
  const props: string[] = event?.signature?.properties ?? [];          // p.ej. ["transaction.id","transaction.status","transaction.amount_in_cents"]
  const values = props
    .map((path) => path.split('.').reduce((o, k) => o?.[k], event.data))
    .join('');
  const toHash = `${values}${event.timestamp}${eventsSecret}`;
  const expected = createHash('sha256').update(toHash).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(String(event?.signature?.checksum ?? ''), 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
```

Pasos del handler de webhook:
1. **Capturar raw body** (en NestJS: `rawBody: true` + `RawBodyRequest`). Verificar la firma **antes** de parsear lógica.
2. **Anti-replay:** rechazar si `|now - event.timestamp| > WOMPI_WEBHOOK_TOLERANCE_SECONDS`.
3. **Idempotencia:** `upsert` por `transactionId`; si ya estaba procesado en estado final, responder 200 sin re-procesar.
4. **Recalcular total** y comparar con `amount_in_cents` del evento; si difiere → rechazar + alertar (tolerancia cero).
5. **Confirmar contra la API** (defensa en profundidad): `GET /v1/transactions/{id}` con la pública como Bearer.
6. Actualizar la orden solo si el estado avanza (estados monotónicos). Responder **200 rápido**.

## Tokens de aceptación (obligatorios al crear transacción server-side)

`GET /v1/merchants/{public_key}` → `presigned_acceptance.acceptance_token` y
`presigned_personal_data_auth.acceptance_token`. Se obtienen frescos (tienen vencimiento) y se incluyen en el pago.

## Fuentes

docs.wompi.co: Widget & Checkout Web · Ambientes y llaves · Transacciones · Eventos · Tokens de aceptación ·
Datos de prueba en sandbox. (Re-verificar antes de cada cambio de pagos.)

## Para pruebas → ver skill `wompi-mocking` (todo contra mocks, sin red).

---
name: wompi-mocking
description: Arnés de testing y mocking de Wompi para Brote — cómo simular TODOS los escenarios de la API y de webhooks SIN tocar la red ni el entorno real. Úsalo siempre que escribas/pruebes pagos. Incluye matriz de escenarios, fixtures de contrato, factories y un helper para firmar webhooks de prueba. Las pruebas automatizadas corren contra mocks (sin red).
---

# Wompi — mocking & testing (Brote)

> Regla #2: **nunca** golpear Wompi real ni usar llaves de producción. El sandbox es solo **referencia de
> contrato** (tarjetas, `sandbox_status`); las pruebas automatizadas corren **contra mocks, sin red**.
> Re-verifica `docs.wompi.co` (Regla #1) antes de fijar nuevos mocks, por si el contrato cambió.

## Referencia de contrato (sandbox)

- Base: `https://sandbox.wompi.co/v1` · llave `pub_test_`.
- Tarjetas: `4242 4242 4242 4242` → **APPROVED** · `4111 1111 1111 1111` → **DECLINED** · cualquier otra → **ERROR**.
- Asíncronos (PSE/QR): campo `sandbox_status` fuerza el estado final. 3DS vía `three_ds_auth_type`.

## Matriz de escenarios (mínimos a cubrir SIEMPRE)

| # | Escenario | Resultado esperado en Brote |
|---|---|---|
| 1 | Transacción **APPROVED** | orden → `PAID`, payment guardado, idempotente |
| 2 | Transacción **DECLINED** | orden → `DECLINED`, no se descuenta stock definitivo |
| 3 | Transacción **ERROR** | orden queda sin pagar, se registra el intento |
| 4 | Transacción **VOIDED** (solo tarjeta) | orden → `VOIDED` |
| 5 | **PENDING → APPROVED** | primer webhook deja PENDING; segundo confirma PAID |
| 6 | **PENDING → DECLINED** | igual, pero termina DECLINED |
| 7 | Webhook con **firma VÁLIDA** | se procesa |
| 8 | Webhook con **firma INVÁLIDA** | se rechaza (401/403), no se toca la orden |
| 9 | **Monto no coincide** con la orden | se rechaza + alerta (tolerancia cero) |
| 10 | **Referencia duplicada** | la creación de orden rechaza/regenera; no hay doble orden |
| 11 | **Timeout / error de red** (GET transaction) | manejo controlado, sin dejar estado inconsistente |
| 12 | **Doble webhook** (misma transacción) | idempotencia: segundo no re-procesa ni duplica efectos |
| 13 | **Orden inexistente** en webhook | se rechaza/loguea, responde 200 sin crear basura |
| 14 | **Replay** (timestamp viejo) | rechazado por la ventana anti-replay |

## Estructura sugerida (cuando exista el scaffold)

```
test/
└── wompi/
    ├── wompi.fixtures.ts     # payloads de transacción y eventos por escenario
    ├── wompi.factory.ts      # builders + signTestEvent()
    └── wompi.client.mock.ts   # mock del cliente HTTP (jest.mock / nock-free)
```

## Fixtures de contrato (plantilla `wompi.fixtures.ts`)

```ts
export const TX = {
  APPROVED: (over = {}) => ({ id: 'test_tx_appr', status: 'APPROVED', amount_in_cents: 119000,
    currency: 'COP', reference: 'BROTE-TEST-1', payment_method_type: 'CARD', ...over }),
  DECLINED: (over = {}) => ({ id: 'test_tx_decl', status: 'DECLINED', amount_in_cents: 119000,
    currency: 'COP', reference: 'BROTE-TEST-1', payment_method_type: 'CARD', ...over }),
  ERROR:    (over = {}) => ({ id: 'test_tx_err',  status: 'ERROR',    amount_in_cents: 119000,
    currency: 'COP', reference: 'BROTE-TEST-1', payment_method_type: 'CARD', ...over }),
  VOIDED:   (over = {}) => ({ id: 'test_tx_void', status: 'VOIDED',   amount_in_cents: 119000,
    currency: 'COP', reference: 'BROTE-TEST-1', payment_method_type: 'CARD', ...over }),
  PENDING:  (over = {}) => ({ id: 'test_tx_pend', status: 'PENDING',  amount_in_cents: 119000,
    currency: 'COP', reference: 'BROTE-TEST-1', payment_method_type: 'PSE',  ...over }),
};
```

## Factory + firma de webhooks de prueba (`wompi.factory.ts`)

Reproduce EXACTAMENTE el algoritmo del productor para generar checksums válidos/ inválidos en test:

```ts
import { createHash } from 'node:crypto';

const TEST_EVENTS_SECRET = 'test_events_FAKE_FOR_TESTS_ONLY';

/** Construye un evento transaction.updated con firma. valid=false produce checksum inválido. */
export function makeWompiEvent(transaction: any, opts: { valid?: boolean; timestamp?: number } = {}) {
  const properties = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
  const timestamp = opts.timestamp ?? Math.floor(Date.now() / 1000);
  const data = { transaction };
  const values = properties.map((p) => p.split('.').reduce((o, k) => o?.[k], data)).join('');
  const checksum = createHash('sha256')
    .update(`${values}${timestamp}${TEST_EVENTS_SECRET}`)
    .digest('hex');
  return {
    event: 'transaction.updated',
    data,
    timestamp,
    signature: { properties, checksum: opts.valid === false ? `${checksum}00` : checksum },
  };
}
```

> El servicio bajo prueba debe leer `WOMPI_EVENTS_SECRET = TEST_EVENTS_SECRET` desde el entorno de test.
> El secreto de test es **falso** y solo vive en el código de pruebas; nunca un secreto real.

## Cómo se mockea el cliente HTTP

- Inyecta un `WompiClient` (provider Nest) y en tests reemplázalo por un mock que resuelve los fixtures:
  `createTransaction()`, `getTransaction(id)`, `getAcceptanceTokens()`. Cero llamadas de red.
- Para el escenario 11, haz que el mock **rechace** (timeout/red) y verifica el manejo.

## Checklist para el revisor antes de aprobar pagos

- [ ] Todos los escenarios 1–14 cubiertos. · [ ] Cero llamadas de red en tests. · [ ] Firma válida **e** inválida.
- [ ] Idempotencia probada con doble webhook. · [ ] Monto recalculado y comparado. · [ ] Anti-replay probado.

import { createHash } from 'node:crypto';

/**
 * Firma de integridad de Wompi.
 * Verificado en docs.wompi.co (Regla #1, 2026-06): concatenar EN ESTE ORDEN y hashear con SHA256,
 * salida en hexadecimal:
 *
 *   reference + amount_in_cents + currency [+ expiration_time] + integrity_secret
 *
 * SOLO en servidor: el `integrity_secret` JAMÁS debe exponerse al cliente.
 */
export function integritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integritySecret: string,
  expirationTime?: string,
): string {
  const base = `${reference}${amountInCents}${currency}${expirationTime ?? ''}${integritySecret}`;
  return createHash('sha256').update(base).digest('hex');
}

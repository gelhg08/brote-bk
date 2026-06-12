import { createHash, timingSafeEqual } from 'node:crypto';
import { WompiEvent } from './dto/webhook-event.dto';

/** Navega un objeto por una ruta "a.b.c" de forma segura (sin `any`). */
function getByPath(root: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, root);
}

/**
 * Checksum esperado del evento (verificado en docs.wompi.co, Regla #1):
 * SHA256( concat(valores de signature.properties, en orden) + signature.timestamp + events_secret ), hex.
 * `signature.properties` es DINÁMICO: se lee del evento, nunca se hardcodea.
 */
export function computeWompiChecksum(
  event: WompiEvent,
  eventsSecret: string,
): string {
  const props = event.signature?.properties ?? [];
  const timestamp = event.signature?.timestamp ?? '';
  const values = props
    .map((path) => {
      const value = getByPath(event.data, path);
      if (typeof value === 'string') return value;
      if (
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'bigint'
      ) {
        return String(value);
      }
      if (value !== null && typeof value === 'object')
        return JSON.stringify(value);
      return '';
    })
    .join('');
  return createHash('sha256')
    .update(`${values}${timestamp}${eventsSecret}`)
    .digest('hex');
}

/** Verifica la firma del webhook en tiempo constante (evita timing attacks). */
export function verifyWompiSignature(
  event: WompiEvent,
  eventsSecret: string,
): boolean {
  const received = String(event?.signature?.checksum ?? '');
  if (!received) return false;
  const expected = computeWompiChecksum(event, eventsSecret);
  let a: Buffer;
  let b: Buffer;
  try {
    a = Buffer.from(expected, 'hex');
    b = Buffer.from(received, 'hex'); // Buffer parsea hex sin distinguir mayúsculas/minúsculas
  } catch {
    return false;
  }
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

/** Anti-replay: el `signature.timestamp` (segundos) debe estar dentro de la ventana de tolerancia. */
export function isWithinTolerance(
  timestampSeconds: number,
  toleranceSeconds: number,
  nowMs: number = Date.now(),
): boolean {
  if (!Number.isFinite(timestampSeconds)) return false;
  return Math.abs(nowMs / 1000 - timestampSeconds) <= toleranceSeconds;
}

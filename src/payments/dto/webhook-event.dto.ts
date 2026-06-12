/** Estructura (parcial) de la transacción dentro de un evento/consulta de Wompi. */
export interface WompiTransaction {
  id: string;
  status: string; // APPROVED | DECLINED | VOIDED | ERROR | PENDING
  amount_in_cents: number;
  reference: string;
  currency?: string;
  payment_method_type?: string | null;
  [key: string]: unknown;
}

/** Objeto `signature` del evento de webhook (verificado en docs.wompi.co, Regla #1). */
export interface WompiSignature {
  /** rutas (relativas a `data`) cuyos valores forman el string a hashear, EN ORDEN. */
  properties: string[];
  /** SHA256(valores + signature.timestamp + events_secret) en hex. */
  checksum: string;
  /** timestamp Unix (segundos) que entra en el cálculo del checksum. */
  timestamp: number;
}

/** Evento `transaction.updated` que envía Wompi al webhook. */
export interface WompiEvent {
  event: string; // "transaction.updated"
  data: { transaction: WompiTransaction };
  sent_at?: string;
  signature: WompiSignature;
}

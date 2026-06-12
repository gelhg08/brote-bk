export type WebhookOutcome = 'processed' | 'ignored' | 'pending' | 'suspicious';

/** Respuesta del handler de webhook / confirmación. Siempre 200 cuando el evento se aceptó. */
export interface WebhookResult {
  received: boolean;
  status: WebhookOutcome;
  transactionId: string;
  /** motivo cuando status = 'ignored' | 'suspicious' (already_processed, order_not_found, ...). */
  reason?: string;
  /** nuevo estado de la orden cuando status = 'processed' (PAID | DECLINED). */
  orderStatus?: string;
}

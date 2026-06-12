import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookResult } from './dto/payment-response.dto';
import { WompiEvent, WompiTransaction } from './dto/webhook-event.dto';
import { isWithinTolerance, verifyWompiSignature } from './wompi-webhook.utils';

const DEFAULT_TOLERANCE_SECONDS = 300;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Procesa el webhook `transaction.updated`. El webhook es la FUENTE DE VERDAD.
   * Verifica firma (sobre el raw body) + anti-replay ANTES de cualquier lógica de negocio.
   */
  async handleWebhook(rawBody: Buffer | undefined): Promise<WebhookResult> {
    if (!rawBody || rawBody.length === 0) {
      throw new BadRequestException('Cuerpo del webhook vacío');
    }

    let event: WompiEvent;
    try {
      event = JSON.parse(rawBody.toString('utf8')) as WompiEvent;
    } catch {
      throw new BadRequestException('Cuerpo del webhook no es JSON válido');
    }

    // a) firma (si inválida → 401, NO procesar)
    const eventsSecret = this.config.get<string>('WOMPI_EVENTS_SECRET') ?? '';
    if (!verifyWompiSignature(event, eventsSecret)) {
      this.logger.warn(
        `Webhook con firma inválida (event=${event?.event ?? 'desconocido'})`,
      );
      throw new UnauthorizedException('Firma de webhook inválida');
    }

    // anti-replay (después de validar la firma)
    const tolerance = Number(
      this.config.get<string | number>('WOMPI_WEBHOOK_TOLERANCE_SECONDS') ??
        DEFAULT_TOLERANCE_SECONDS,
    );
    if (!isWithinTolerance(event.signature.timestamp, tolerance)) {
      this.logger.warn(
        'Webhook fuera de la ventana de tiempo (posible replay)',
      );
      throw new UnauthorizedException('Evento fuera de la ventana de tiempo');
    }

    return this.processTransaction(
      event.data.transaction,
      event as unknown as Prisma.InputJsonValue,
    );
  }

  /**
   * Fallback: si el webhook no llegó, consulta el estado real a Wompi y lo procesa con las
   * mismas reglas (idempotencia, verificación de monto, mapeo de estados).
   */
  async confirmTransaction(transactionId: string): Promise<WebhookResult> {
    const tx = await this.fetchTransaction(transactionId);
    return this.processTransaction(tx, tx as unknown as Prisma.InputJsonValue);
  }

  /** GET {WOMPI_BASE_URL}/transactions/{id} con Bearer (llave privada, solo servidor). */
  private async fetchTransaction(
    transactionId: string,
  ): Promise<WompiTransaction> {
    const baseUrl = this.config.get<string>('WOMPI_BASE_URL') ?? '';
    const privateKey = this.config.get<string>('WOMPI_PRIVATE_KEY') ?? '';

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/transactions/${transactionId}`, {
        headers: { Authorization: `Bearer ${privateKey}` },
      });
    } catch (err) {
      this.logger.error(`Error de red consultando Wompi: ${String(err)}`);
      throw new ServiceUnavailableException(
        'No se pudo consultar la transacción en Wompi',
      );
    }

    if (!res.ok) {
      throw new ServiceUnavailableException(
        `Wompi respondió ${res.status} al consultar la transacción`,
      );
    }

    const body = (await res.json()) as { data?: WompiTransaction };
    if (!body?.data?.id) {
      throw new ServiceUnavailableException('Respuesta de Wompi inválida');
    }
    return body.data;
  }

  /**
   * Núcleo común (webhook y confirmación):
   * idempotencia → orden → estado final → verificación de monto → mapeo de estado + Payment atómico.
   */
  private async processTransaction(
    tx: WompiTransaction,
    rawPayload: Prisma.InputJsonValue,
  ): Promise<WebhookResult> {
    const transactionId = tx.id;

    // c) idempotencia por transactionId
    const existing = await this.prisma.payment.findUnique({
      where: { transactionId },
    });
    if (existing) {
      this.logger.log(`Pago ya procesado, se ignora (tx=${transactionId})`);
      return {
        received: true,
        status: 'ignored',
        reason: 'already_processed',
        transactionId,
      };
    }

    // d) orden por referencia
    const order = await this.prisma.order.findUnique({
      where: { reference: tx.reference },
    });
    if (!order) {
      this.logger.warn(
        `Orden no encontrada para reference=${tx.reference} (tx=${transactionId})`,
      );
      return {
        received: true,
        status: 'ignored',
        reason: 'order_not_found',
        transactionId,
      };
    }

    // orden ya en estado final → no reprocesar (idempotencia a nivel de orden)
    if (order.status !== 'PENDING') {
      this.logger.log(
        `Orden ${order.id} ya en estado ${order.status}, no se reprocesa`,
      );
      return {
        received: true,
        status: 'ignored',
        reason: 'order_already_final',
        transactionId,
      };
    }

    // e) el monto del evento DEBE coincidir con el total recalculado de la orden (tolerancia cero)
    if (tx.amount_in_cents !== order.totalInCents) {
      this.logger.error(
        `Monto no coincide para ${tx.reference}: evento=${tx.amount_in_cents} orden=${order.totalInCents}`,
      );
      return {
        received: true,
        status: 'suspicious',
        reason: 'amount_mismatch',
        transactionId,
      };
    }

    // f) PENDING (transitorio) → no cambia estado
    if (tx.status === 'PENDING') {
      this.logger.log(
        `Transacción PENDING (tx=${transactionId}), sin cambio de estado`,
      );
      return { received: true, status: 'pending', transactionId };
    }

    // estado final → Payment + actualización de orden, atómico
    const approved = tx.status === 'APPROVED';
    const newOrderStatus = approved ? 'PAID' : 'DECLINED';

    try {
      await this.prisma.$transaction([
        this.prisma.payment.create({
          data: {
            orderId: order.id,
            transactionId,
            status: tx.status,
            amountInCents: tx.amount_in_cents,
            method: tx.payment_method_type ?? null,
            rawWebhookPayload: rawPayload,
          },
        }),
        // solo avanza si sigue PENDING (defensa extra ante carreras)
        this.prisma.order.updateMany({
          where: { id: order.id, status: 'PENDING' },
          data: { status: newOrderStatus },
        }),
      ]);
    } catch (err) {
      // carrera: otro webhook idéntico ya creó el Payment (transactionId único)
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        this.logger.log(
          `Pago creado en paralelo, se ignora (tx=${transactionId})`,
        );
        return {
          received: true,
          status: 'ignored',
          reason: 'already_processed',
          transactionId,
        };
      }
      throw err;
    }

    this.logger.log(
      `Pago ${tx.status} procesado (tx=${transactionId}, orden ${order.id} → ${newOrderStatus})`,
    );
    return {
      received: true,
      status: 'processed',
      orderStatus: newOrderStatus,
      transactionId,
    };
  }
}

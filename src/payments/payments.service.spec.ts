import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { WompiTransaction } from './dto/webhook-event.dto';
import { PaymentsService } from './payments.service';

const EVENTS_SECRET = 'test_events_SEED';
const TOLERANCE = 300;

function tx(over: Partial<WompiTransaction> = {}): WompiTransaction {
  return {
    id: 'wtx_1',
    status: 'APPROVED',
    amount_in_cents: 6_298_000,
    reference: 'BR-REF1',
    currency: 'COP',
    payment_method_type: 'CARD',
    ...over,
  };
}

/** Construye un evento transaction.updated firmado como lo hace Wompi (signature.timestamp). */
function makeEvent(
  transaction: WompiTransaction,
  opts: { invalid?: boolean; timestamp?: number } = {},
): Buffer {
  const properties = [
    'transaction.id',
    'transaction.status',
    'transaction.amount_in_cents',
  ];
  const timestamp = opts.timestamp ?? Math.floor(Date.now() / 1000);
  const data = { transaction };
  // properties = [transaction.id, transaction.status, transaction.amount_in_cents] → valores directos
  const values = `${transaction.id}${transaction.status}${transaction.amount_in_cents}`;
  let checksum = createHash('sha256')
    .update(`${values}${timestamp}${EVENTS_SECRET}`)
    .digest('hex');
  if (opts.invalid) checksum = `${checksum.slice(0, -2)}00`;
  const event = {
    event: 'transaction.updated',
    data,
    sent_at: new Date().toISOString(),
    signature: { properties, checksum, timestamp },
  };
  return Buffer.from(JSON.stringify(event));
}

const order = (over: Record<string, unknown> = {}) => ({
  id: 1,
  reference: 'BR-REF1',
  totalInCents: 6_298_000,
  status: 'PENDING',
  ...over,
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: {
    payment: { findUnique: jest.Mock; create: jest.Mock };
    order: { findUnique: jest.Mock; updateMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      payment: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      order: {
        findUnique: jest.fn().mockResolvedValue(order()),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };

    const config = {
      get: jest.fn(
        (k: string) =>
          ({
            WOMPI_EVENTS_SECRET: EVENTS_SECRET,
            WOMPI_WEBHOOK_TOLERANCE_SECONDS: TOLERANCE,
            WOMPI_BASE_URL: 'https://sandbox.wompi.co/v1',
            WOMPI_PRIVATE_KEY: 'prv_test_X',
          })[k],
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  describe('handleWebhook', () => {
    it('APPROVED → orden PAID y Payment creado', async () => {
      const res = await service.handleWebhook(
        makeEvent(tx({ status: 'APPROVED' })),
      );
      expect(res.status).toBe('processed');
      expect(res.orderStatus).toBe('PAID');
      expect(prisma.payment.create).toHaveBeenCalledTimes(1);
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 1, status: 'PENDING' },
        data: { status: 'PAID' },
      });
    });

    it('DECLINED → orden DECLINED', async () => {
      const res = await service.handleWebhook(
        makeEvent(tx({ status: 'DECLINED' })),
      );
      expect(res.orderStatus).toBe('DECLINED');
    });

    it('VOIDED → orden DECLINED', async () => {
      const res = await service.handleWebhook(
        makeEvent(tx({ status: 'VOIDED' })),
      );
      expect(res.orderStatus).toBe('DECLINED');
    });

    it('PENDING → no cambia estado, no crea Payment', async () => {
      const res = await service.handleWebhook(
        makeEvent(tx({ status: 'PENDING' })),
      );
      expect(res.status).toBe('pending');
      expect(prisma.payment.create).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('firma INVÁLIDA → 401 y no procesa', async () => {
      await expect(
        service.handleWebhook(makeEvent(tx(), { invalid: true })),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    });

    it('firma válida pero monto no coincide → suspicious, no procesa', async () => {
      const res = await service.handleWebhook(
        makeEvent(tx({ amount_in_cents: 9_999_999 })),
      );
      expect(res.status).toBe('suspicious');
      expect(res.reason).toBe('amount_mismatch');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('referencia inexistente → ignora (200)', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      const res = await service.handleWebhook(makeEvent(tx()));
      expect(res.status).toBe('ignored');
      expect(res.reason).toBe('order_not_found');
    });

    it('duplicado (mismo transactionId) → idempotente, no reprocesa', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 99,
        transactionId: 'wtx_1',
      });
      const res = await service.handleWebhook(makeEvent(tx()));
      expect(res.status).toBe('ignored');
      expect(res.reason).toBe('already_processed');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('anti-replay (timestamp viejo) → 401', async () => {
      const old = Math.floor(Date.now() / 1000) - (TOLERANCE + 60);
      await expect(
        service.handleWebhook(makeEvent(tx(), { timestamp: old })),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('orden ya en estado final (PAID) → no cambia', async () => {
      prisma.order.findUnique.mockResolvedValue(order({ status: 'PAID' }));
      const res = await service.handleWebhook(makeEvent(tx()));
      expect(res.status).toBe('ignored');
      expect(res.reason).toBe('order_already_final');
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('carrera P2002 al crear Payment → idempotente', async () => {
      prisma.$transaction.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', {
          code: 'P2002',
          clientVersion: '6.19.2',
        }),
      );
      const res = await service.handleWebhook(
        makeEvent(tx({ status: 'APPROVED' })),
      );
      expect(res.status).toBe('ignored');
      expect(res.reason).toBe('already_processed');
    });
  });

  describe('confirmTransaction (fallback)', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('consulta exitosa APPROVED → procesa', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: tx({ status: 'APPROVED' }) }),
      });

      const res = await service.confirmTransaction('wtx_1');
      expect(res.status).toBe('processed');
      expect(res.orderStatus).toBe('PAID');
    });

    it('consulta DECLINED → orden DECLINED', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: tx({ status: 'DECLINED' }) }),
      });

      const res = await service.confirmTransaction('wtx_1');
      expect(res.orderStatus).toBe('DECLINED');
    });

    it('error de red al consultar Wompi → ServiceUnavailable', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
      await expect(service.confirmTransaction('wtx_1')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });
});

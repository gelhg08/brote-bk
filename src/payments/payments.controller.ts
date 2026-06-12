import { Controller, Get, HttpCode, Param, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { WebhookResult } from './dto/payment-response.dto';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /**
   * POST /api/v1/webhooks/wompi — webhook `transaction.updated` (fuente de verdad).
   * Sin rate limit (Wompi reintenta). Verifica la firma sobre el raw body.
   */
  @SkipThrottle()
  @Post('webhooks/wompi')
  @HttpCode(200)
  wompiWebhook(@Req() req: RawBodyRequest<Request>): Promise<WebhookResult> {
    return this.payments.handleWebhook(req.rawBody);
  }

  /** GET /api/v1/payments/confirm/:transactionId — fallback de confirmación por API. */
  @Get('payments/confirm/:transactionId')
  confirm(
    @Param('transactionId') transactionId: string,
  ): Promise<WebhookResult> {
    return this.payments.confirmTransaction(transactionId);
  }
}

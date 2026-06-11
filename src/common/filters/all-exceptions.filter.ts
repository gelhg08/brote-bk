import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtro global de excepciones. Formato de salida uniforme `{ code, message, details }`.
 * NUNCA envía stack traces ni internals al cliente; los errores no-HTTP se loguean en servidor.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Error interno del servidor';
    let details: unknown = null;

    if (isHttp) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        if (Array.isArray(b.message)) {
          message = 'Error de validación';
          details = b.message; // mensajes de class-validator
        } else {
          message = (b.message as string) ?? exception.message;
          details = b.details ?? null;
        }
      }
    } else {
      // Error inesperado: log interno con stack, respuesta genérica al cliente.
      this.logger.error(
        `${req.method} ${req.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    res.status(status).json({ code: status, message, details });
  }
}

import { z } from 'zod';

/**
 * Validación de variables de entorno (falla rápido al arrancar si falta o está mal una).
 * No loguear nunca el contenido completo: contiene secretos.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:3001'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),

  // Wompi — solo SANDBOX en desarrollo (el hook bloquea producción)
  WOMPI_BASE_URL: z.string().url().default('https://sandbox.wompi.co/v1'),
  WOMPI_PUBLIC_KEY: z.string().min(1),
  WOMPI_PRIVATE_KEY: z.string().min(1),
  WOMPI_INTEGRITY_SECRET: z.string().min(1),
  WOMPI_EVENTS_SECRET: z.string().min(1),
  WOMPI_WEBHOOK_TOLERANCE_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(300),
});

export type Env = z.infer<typeof envSchema>;

/** Usada por ConfigModule.forRoot({ validate }). */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(raíz)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Variables de entorno inválidas:\n${issues}`);
  }
  return parsed.data;
}

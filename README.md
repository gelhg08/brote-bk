# Brote — Backend (API)

API REST del e-commerce **Brote** (productos ecológicos reutilizables, Colombia). Checkout **invitado**,
pagos con **Wompi**. Stack: **NestJS v11 · Prisma 6 · MySQL**.

> Documento maestro / fuente de verdad: [`docs/PROYECTO.md`](docs/PROYECTO.md).
> Reglas de trabajo y harness de Claude Code: [`CLAUDE.md`](CLAUDE.md) y [`.claude/README.md`](.claude/README.md).

## Requisitos

- Node ≥ 20 · npm · MySQL 8.x

## Puesta en marcha

```bash
cp .env.example .env          # rellena DATABASE_URL y llaves Wompi (SANDBOX)
npm install
npx prisma generate
npx prisma migrate dev        # crea el esquema en MySQL (requiere DB arriba)
npm run start:dev             # http://localhost:3000/api/v1
```

Health check: `GET /api/v1/health` → `{ "status": "ok", "service": "brote-api" }`.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run start:dev` | API en watch |
| `npm run build` | Compila a `dist/` |
| `npm test` | Tests unitarios (Jest) |
| `npm run test:e2e` | Tests e2e (requiere BD y `.env`) |
| `npm run lint` | ESLint + fix |
| `npm run prisma:migrate` | Migraciones de desarrollo |
| `npm run prisma:studio` | Prisma Studio |
| `npm run db:seed` | Seed (cuando exista `prisma/seed.ts`) |

## Arquitectura

Módulo por dominio (`products`, `orders`, `payments`). Fundación ya montada: `ValidationPipe` global,
`helmet`, CORS, `rawBody` (para webhooks), `@nestjs/throttler`, `ConfigModule` + validación Zod, filtro de
excepciones `{code,message,details}`, `PrismaModule` global. Esquema de datos en
[`prisma/schema.prisma`](prisma/schema.prisma). Detalle en `docs/PROYECTO.md` §5.

## Reglas críticas

- Dinero en **centavos** (`Int`), total **con IVA (19%)** recalculado en servidor.
- Wompi: firma de integridad **solo servidor**, **webhook = fuente de verdad** (firma verificada sobre raw body),
  **solo sandbox** en desarrollo. Ver skill `wompi-integracion`.
- Nunca secretos en el repo (`.env` ignorado). Comandos de nube **read-only**.

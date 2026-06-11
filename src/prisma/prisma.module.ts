import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/** Global para que cualquier módulo de dominio inyecte PrismaService sin re-importar. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

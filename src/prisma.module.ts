import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Esto hace que el servicio esté disponible en toda la app
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Muy importante exportarlo
})
export class PrismaModule {}
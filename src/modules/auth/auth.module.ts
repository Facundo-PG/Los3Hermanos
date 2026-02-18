import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt'; // <--- Importante
import { PassportModule } from '@nestjs/passport'; // <--- Importante
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersRepository } from './repository/auth.repository';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    // Configuramos el módulo de JWT para que AuthService pueda usar JwtService
    JwtModule.register({
      secret: 'CLAVE_SUPER_SECRETA_DE_LA_POLLERIA', // Usá una frase larga
      signOptions: { expiresIn: '1d' }, // El token dura 24 horas
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersRepository, JwtStrategy],
})
export class AuthModule {}
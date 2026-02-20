import { Injectable, ConflictException, UnauthorizedException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { UsersRepository } from './repository/auth.repository';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { createHash, randomBytes } from 'crypto';
import { NotificationsService } from '../notifications/service/notifications.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService, // Inyectalo acá
    private readonly notificationsService: NotificationsService,
  ) { }

  private getFrontendUrl() {
    const frontendUrl = process.env.FRONTEND_URL;
    if (frontendUrl) {
      return frontendUrl;
    }

    if (process.env.NODE_ENV !== 'production') {
      return 'http://localhost:3000';
    }

    throw new InternalServerErrorException('Falta FRONTEND_URL para generar enlaces de correo en producción');
  }

  private getBackendUrl() {
    const backendUrl = process.env.BACKEND_URL;
    if (backendUrl) {
      return backendUrl;
    }

    if (process.env.NODE_ENV !== 'production') {
      const port = process.env.PORT || '3001';
      return `http://localhost:${port}`;
    }

    throw new InternalServerErrorException('Falta BACKEND_URL para generar enlaces de confirmación en producción');
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Buscar usuario por email
    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Comparar contraseña hasheada
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Generar el JWT
    const payload = { sub: user.id, email: user.email, rol: user.rol };

    return {
      user: {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol
      },
      access_token: await this.jwtService.signAsync(payload),
    };
  }
  async register(registerDto: RegisterDto) {
    const { email, password, nombre, telefono, direccion } = registerDto;

    // 1. Verificar si el usuario ya existe
    const existingUser = await this.usersRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está en uso');
    }

    // 2. Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Generar token de confirmación con los datos de registro pendientes
    const emailConfirmationToken = await this.jwtService.signAsync(
      {
        type: 'email_confirmation',
        registration: {
          email,
          password: hashedPassword,
          nombre,
          telefono,
          direccion,
        },
      },
      { expiresIn: '24h' },
    );

    const backendUrl = this.getBackendUrl();
    const confirmationUrl = `${backendUrl}/auth/confirm-email?token=${emailConfirmationToken}`;

    await this.notificationsService.sendEmailConfirmationEmail(
      email,
      nombre,
      confirmationUrl,
    );

    return {
      requiresEmailVerification: true,
      emailSent: true,
      status: 'pending_confirmation',
      message: 'Registro pendiente. Revisa tu correo para confirmar tu cuenta.',
    };
  }

  async confirmEmail(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{
        type: 'email_confirmation',
        registration: {
          email: string;
          password: string;
          nombre: string;
          telefono?: string;
          direccion?: string;
        };
      }>(token);

      if (payload.type !== 'email_confirmation' || !payload.registration) {
        throw new ForbiddenException('Token de confirmación inválido');
      }

      const existingUser = await this.usersRepository.findByEmail(payload.registration.email);
      if (existingUser) {
        throw new ConflictException('El correo electrónico ya fue confirmado');
      }

      const createdUser = await this.usersRepository.createUser(
        {
          email: payload.registration.email,
          password: '',
          nombre: payload.registration.nombre,
          telefono: payload.registration.telefono,
          direccion: payload.registration.direccion,
        },
        payload.registration.password,
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = createdUser;

      return {
        message: 'Correo confirmado. Usuario creado correctamente.',
        user: userWithoutPassword,
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Token de confirmación inválido o expirado');
    }
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    return this.usersRepository.updateUserWithRules(id, updateUserDto);
  }

  async deleteUser(id: number, requestingUserId: number) {
    return this.usersRepository.deleteUserWithRules(id, requestingUserId);
  }

  async forgotPassword(email: string) {
    const genericResponse = {
      message: 'Si el correo existe, recibirás un enlace de recuperación',
    };

    const user = await this.usersRepository.findByEmail(email);
    if (!user) {
      return genericResponse;
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.usersRepository.createPasswordResetToken(user.id, tokenHash, expiresAt);

    const frontendUrl = this.getFrontendUrl();
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.notificationsService.sendPasswordResetEmail(
      user.email,
      user.nombre,
      resetUrl,
    );

    return genericResponse;
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    return this.usersRepository.resetPasswordByTokenHash(tokenHash, newPassword);
  }
}
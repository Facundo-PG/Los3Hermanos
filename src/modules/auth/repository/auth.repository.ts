import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.users.findUnique({
      where: { email },
    });
  }

  async createUser(data: RegisterDto, hashedPassword: string) {
    return this.prisma.users.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        password: hashedPassword,
        telefono: data.telefono,
        direccion: data.direccion,
        rol: 'cliente', // Valor por defecto
      },
    });
  }
}
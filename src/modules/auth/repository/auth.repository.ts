import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { RegisterDto } from '../dto/register.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) { }

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

  async findById(id: number) {
    return this.prisma.users.findUnique({
      where: { id },
    });
  }

  async updateUser(id: number, data: Prisma.usersUpdateInput) {
    return this.prisma.users.update({
      where: { id },
      data,
    });
  }



  async updateUserWithRules(id: number, updateUserDto: UpdateUserDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.users.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await tx.users.findUnique({
          where: { email: updateUserDto.email },
        });

        if (existingUser) {
          throw new ConflictException('El correo electrónico ya está en uso');
        }
      }

      if (user.rol === 'admin' && updateUserDto.rol === 'cliente') {
        const adminsCount = await tx.users.count({
          where: { rol: 'admin' },
        });

        if (adminsCount <= 1) {
          throw new ForbiddenException('No puedes quitar el rol al último administrador del sistema');
        }
      }

      const updateData: Prisma.usersUpdateInput = {
        nombre: updateUserDto.nombre,
        email: updateUserDto.email,
        telefono: updateUserDto.telefono,
        direccion: updateUserDto.direccion,
        rol: updateUserDto.rol,
      };

      if (updateUserDto.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateUserDto.password, salt);
      }

      const updatedUser = await tx.users.update({
        where: { id },
        data: updateData,
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }

  async deleteUserWithRules(id: number, requestingUserId: number) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (id === requestingUserId) {
          throw new ForbiddenException('No puedes eliminar tu propio usuario');
        }

        const user = await tx.users.findUnique({
          where: { id },
        });

        if (!user) {
          throw new NotFoundException('Usuario no encontrado');
        }

        if (user.rol === 'admin') {
          const adminsCount = await tx.users.count({
            where: { rol: 'admin' },
          });

          if (adminsCount <= 1) {
            throw new ForbiddenException('No puedes eliminar al último administrador del sistema');
          }
        }

        const deletedUser = await tx.users.delete({
          where: { id },
        });

        const { password: _, ...userWithoutPassword } = deletedUser;
        return {
          message: 'Usuario eliminado exitosamente',
          data: userWithoutPassword,
        };
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (
        error instanceof NotFoundException
        || error instanceof ForbiddenException
        || error instanceof ConflictException
      ) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError
        && error.code === 'P2003'
      ) {
        throw new ConflictException('No se pudo eliminar el usuario porque tiene registros asociados');
      }

      throw new ConflictException('No se pudo eliminar el usuario');
    }
  }

  async createPasswordResetToken(userId: number, tokenHash: string, expiresAt: Date) {
    await this.prisma.user_tokens.deleteMany({
      where: {
        user_id: userId,
        used_at: null,
      },
    });

    return this.prisma.user_tokens.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });
  }

  async resetPasswordByTokenHash(tokenHash: string, newPassword: string) {
    return this.prisma.$transaction(async (tx) => {
      const resetToken = await tx.user_tokens.findFirst({
        where: {
          token_hash: tokenHash,
          used_at: null,
          expires_at: {
            gt: new Date(),
          },
        },
      });

      if (!resetToken) {
        throw new ForbiddenException('Token inválido o expirado');
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      await tx.users.update({
        where: { id: resetToken.user_id },
        data: { password: passwordHash },
      });

      await tx.user_tokens.update({
        where: { id: resetToken.id },
        data: { used_at: new Date() },
      });

      return { message: 'Contraseña actualizada correctamente' };
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  }
}
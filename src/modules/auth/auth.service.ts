import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { UsersRepository } from './repository/auth.repository';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService, // Inyectalo acá
  ) { }

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
    const { email, password } = registerDto;

    // 1. Verificar si el usuario ya existe
    const existingUser = await this.usersRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya está en uso');
    }

    // 2. Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Guardar en la base de datos a través del repositorio
    const newUser = await this.usersRepository.createUser(registerDto, hashedPassword);

    // 4. Limpiar la respuesta para no devolver el hash de la contraseña
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = newUser;

    return userWithoutPassword;
  }
}
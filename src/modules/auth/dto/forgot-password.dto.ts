import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
    @ApiProperty({ example: 'juan@example.com', description: 'Correo del usuario para recuperar contraseña' })
    @IsEmail({}, { message: 'El email no es válido' })
    @IsNotEmpty()
    email: string;
}

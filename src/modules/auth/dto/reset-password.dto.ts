import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class ResetPasswordDto {
    @ApiProperty({ example: 'token-largo-recibido-por-email' })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({ example: 'NuevaClaveSegura123', description: 'Nueva contraseña (mínimo 6 caracteres)' })
    @IsString()
    @MinLength(6)
    password: string;
}

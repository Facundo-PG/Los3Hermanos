import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
    @ApiPropertyOptional({ example: 'Juan Pérez' })
    @IsOptional()
    @IsString()
    nombre?: string;

    @ApiPropertyOptional({ example: 'juan@example.com' })
    @IsOptional()
    @IsEmail({}, { message: 'El email no es válido' })
    email?: string;

    @ApiPropertyOptional({ example: '123456', description: 'Contraseña (mínimo 6 caracteres)' })
    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;

    @ApiPropertyOptional({ example: '1122334455' })
    @IsOptional()
    @IsString()
    telefono?: string;

    @ApiPropertyOptional({ example: 'Calle Falsa 123' })
    @IsOptional()
    @IsString()
    direccion?: string;

    @ApiPropertyOptional({ example: 'cliente', enum: ['admin', 'cliente'] })
    @IsOptional()
    @IsString()
    @IsIn(['admin', 'cliente'], { message: 'El rol debe ser admin o cliente' })
    rol?: string;
}
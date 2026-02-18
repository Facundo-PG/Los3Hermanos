import { IsString, IsNumber, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailDto {
    @ApiProperty({ description: 'ID de la orden' })
    @IsNumber()
    order_id: number;

    @ApiProperty({ description: 'Nuevo estado de la orden' })
    @IsString()
    estado: string;

    @ApiProperty({ description: 'Email del cliente' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'Nombre del cliente' })
    @IsString()
    nombre: string;
}
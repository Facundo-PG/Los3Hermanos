import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingsDto {
    @ApiProperty({ required: false, description: 'Costo de delivery' })
    @IsOptional()
    @IsNumber()
    costo_delivery?: number;

    @ApiProperty({ required: false, description: 'Número de WhatsApp para notificaciones' })
    @IsOptional()
    @IsString()
    whatsapp_notificaciones?: string;

    @ApiProperty({ required: false, description: 'Estado del local (abierto/cerrado)' })
    @IsOptional()
    @IsBoolean()
    esta_abierto?: boolean;

    @ApiProperty({ required: false, description: 'Dirección del local' })
    @IsOptional()
    @IsString()
    direccion_local?: string;

    @ApiProperty({ required: false, description: 'Mensaje de alerta para los clientes' })
    @IsOptional()
    @IsString()
    mensaje_alerta?: string;
}

import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    estado?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    tipo_entrega?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    notas?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    metodo_pago?: string;
}

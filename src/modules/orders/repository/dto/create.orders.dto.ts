import { IsNumber, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsNumber()
    product_id: number;

    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsNumber()
    cantidad: number;
}

export class CreateOrderDto {
    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsNumber()
    user_id: number;

    @ApiProperty({ required: true })
    @IsNotEmpty()
    tipo_entrega: string;

    @ApiProperty({ required: false })
    @IsOptional()
    notas?: string;

    @ApiProperty({ required: true })
    @IsNotEmpty()
    metodo_pago: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    comprobante_url?: string;

    @ApiProperty({ required: true, type: [OrderItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];
}

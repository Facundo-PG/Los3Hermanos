import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    category_id?: number;

    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsString()
    nombre: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    descripcion?: string;

    @ApiProperty({ required: true })
    @IsNotEmpty()
    @IsNumber()
    precio: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    stock?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    imagen_url?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    activo?: boolean;
}

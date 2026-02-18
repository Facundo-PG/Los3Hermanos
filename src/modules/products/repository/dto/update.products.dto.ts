import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    category_id?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    nombre?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    descripcion?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    precio?: number;

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

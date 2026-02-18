import { Controller, Get, Query, Res, UseGuards, Param, Post, Body, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { ProductsService } from './service/products.service';
import { PaginationRequestListDto } from '../../helpers/paginationParams.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { CreateProductDto } from './repository/dto/create.products.dto';
import { UpdateProductDto } from './repository/dto/update.products.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }
    @Roles('admin', 'cliente') // Solo si el token dice que sos admin o cliente
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('list')
    @ApiOperation({ summary: 'List products success' })
    @ApiResponse({ status: 200, description: 'List products success' })
    @ApiResponse({
        status: 500,
        description: 'Internal Server Error',
        schema: {
            example: {
                statusCode: 500,
                message: 'Internal Server Error',
                data: { mensajeError: 'Error al obtener los productos del sistema' },
            },
        },
    })
    async listProducts(
        @Query() options: PaginationRequestListDto,
        @Res() res: Response,
    ) {
        const { statusCode, message, data } =
            await this.productsService.listProducts(options);
        res.status(statusCode).json({
            statusCode,
            message,
            data,
        });
    }

    @Roles('admin', 'cliente')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('byid')
    @ApiOperation({ summary: 'Get product by ID success' })
    @ApiResponse({ status: 200, description: 'Get product by ID success' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    @ApiResponse({
        status: 500,
        description: 'Internal Server Error',
        schema: {
            example: {
                statusCode: 500,
                message: 'Internal Server Error',
                data: { mensajeError: 'Error al obtener el producto por ID' },
            },
        },
    })
    async getProductById(
        @Query('id') id: string,
        @Res() res: Response,
    ) {
        const { statusCode, message, data } =
            await this.productsService.getProductById(Number(id));
        res.status(statusCode).json({
            statusCode,
            message,
            data,
        });
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('create')
    @ApiOperation({ summary: 'Create product success' })
    @ApiResponse({ status: 201, description: 'Product created successfully' })
    @ApiResponse({
        status: 500,
        description: 'Internal Server Error',
        schema: {
            example: {
                statusCode: 500,
                message: 'Internal Server Error',
                data: { mensajeError: 'Error al crear el producto' },
            },
        },
    })
    async createProduct(
        @Body() data: CreateProductDto,
        @Res() res: Response,
    ) {
        const { statusCode, message, data: productData } =
            await this.productsService.createProduct(data);
        res.status(statusCode).json({
            statusCode,
            message,
            data: productData,
        });
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Put('update')
    @ApiOperation({ summary: 'Update product success' })
    @ApiResponse({ status: 200, description: 'Product updated successfully' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    @ApiResponse({
        status: 500,
        description: 'Internal Server Error',
        schema: {
            example: {
                statusCode: 500,
                message: 'Internal Server Error',
                data: { mensajeError: 'Error al actualizar el producto' },
            },
        },
    })
    async updateProduct(
        @Query('id') id: string,
        @Body() data: UpdateProductDto,
        @Res() res: Response,
    ) {
        const { statusCode, message, data: productData } =
            await this.productsService.updateProduct(Number(id), data);
        res.status(statusCode).json({
            statusCode,
            message,
            data: productData,
        });
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete('delete')
    @ApiOperation({ summary: 'Delete product success' })
    @ApiResponse({ status: 200, description: 'Product deleted successfully' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    @ApiResponse({
        status: 500,
        description: 'Internal Server Error',
        schema: {
            example: {
                statusCode: 500,
                message: 'Internal Server Error',
                data: { mensajeError: 'Error al eliminar el producto' },
            },
        },
    })
    async deleteProduct(
        @Query('id') id: string,
        @Res() res: Response,
    ) {
        const { statusCode, message, data } =
            await this.productsService.deleteProduct(Number(id));
        res.status(statusCode).json({
            statusCode,
            message,
            data,
        });
    }
}

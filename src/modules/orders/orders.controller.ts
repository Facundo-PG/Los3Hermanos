import { Controller, Post, Body, Res, UseGuards, Get, Query, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { OrdersService } from './service/orders.service';
import { CreateOrderDto } from './repository/dto/create.orders.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators'; import { PaginationRequestListDto } from '../../helpers/paginationParams.dto'; import { UpdateOrderDto } from './repository/dto/update.orders.dto'; @ApiTags('Orders')
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Roles('admin', 'cliente')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('create')
    @ApiOperation({ summary: 'Create order success' })
    @ApiResponse({ status: 201, description: 'Order created successfully' })
    @ApiResponse({
        status: 500,
        description: 'Internal Server Error',
        schema: {
            example: {
                statusCode: 500,
                message: 'Internal Server Error',
                data: { mensajeError: 'Error al crear la orden' },
            },
        },
    })
    async createOrder(
        @Body() data: CreateOrderDto,
        @Res() res: Response,
    ) {
        const { statusCode, message, data: orderData } =
            await this.ordersService.createOrder(data);
        res.status(statusCode).json({
            statusCode,
            message,
            data: orderData,
        });
    }

    @Roles('admin', 'cliente')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('list')
    @ApiOperation({ summary: 'List orders success' })
    @ApiResponse({ status: 200, description: 'List orders success' })
    @ApiResponse({
        status: 500,
        description: 'Internal Server Error',
        schema: {
            example: {
                statusCode: 500,
                message: 'Internal Server Error',
                data: { mensajeError: 'Error al obtener las órdenes del sistema' },
            },
        },
    })
    async listOrders(
        @Query() options: PaginationRequestListDto,
        @Res() res: Response,
    ) {
        const { statusCode, message, data } =
            await this.ordersService.listOrders(options);
        res.status(statusCode).json({
            statusCode,
            message,
            data,
        });
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Put('update')
    @ApiOperation({ summary: 'Update order success' })
    @ApiResponse({ status: 200, description: 'Order updated successfully' })
    @ApiResponse({ status: 404, description: 'Order not found' })
    @ApiResponse({
        status: 500,
        description: 'Internal Server Error',
        schema: {
            example: {
                statusCode: 500,
                message: 'Internal Server Error',
                data: { mensajeError: 'Error al actualizar la orden' },
            },
        },
    })
    async updateOrder(
        @Query('id') id: string,
        @Body() data: UpdateOrderDto,
        @Res() res: Response,
    ) {
        const { statusCode, message, data: orderData } =
            await this.ordersService.updateOrder(Number(id), data);
        res.status(statusCode).json({
            statusCode,
            message,
            data: orderData,
        });
    }

    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Get('dashboard')
    @ApiOperation({ summary: 'Get dashboard data' })
    @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
    @ApiResponse({
        status: 500,
        description: 'Internal Server Error',
        schema: {
            example: {
                statusCode: 500,
                message: 'Internal Server Error',
                data: { mensajeError: 'Error al obtener datos del dashboard' },
            },
        },
    })
    async getDashboard(@Res() res: Response) {
        const { statusCode, message, data } =
            await this.ordersService.getDashboard();
        res.status(statusCode).json({
            statusCode,
            message,
            data,
        });
    }
}

import { Controller, Post, Body, Res, UseGuards, Get, Query, Put, Delete, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Request } from 'express';
import type { File } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Response } from 'express';
import { OrdersService } from './service/orders.service';
import { CreateOrderDto } from './repository/dto/create.orders.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators'; import { PaginationRequestListDto } from '../../helpers/paginationParams.dto'; import { UpdateOrderDto } from './repository/dto/update.orders.dto';

const uploadsDir = join(process.cwd(), 'uploads', 'comprobantes');
if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
}

@ApiTags('Orders')
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
        console.log(`[CONTROLLER] PUT /orders/update - ID: ${id}, Body:`, JSON.stringify(data));
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

    @Roles('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Delete('delete')
    @ApiOperation({ summary: 'Delete order success' })
    @ApiResponse({ status: 200, description: 'Order deleted successfully' })
    @ApiResponse({ status: 404, description: 'Order not found' })
    @ApiResponse({
        status: 500,
        description: 'Internal Server Error',
        schema: {
            example: {
                statusCode: 500,
                message: 'Internal Server Error',
                data: { mensajeError: 'Error al eliminar la orden' },
            },
        },
    })
    async deleteOrder(
        @Query('id') id: string,
        @Res() res: Response,
    ) {
        const { statusCode, message, data } =
            await this.ordersService.deleteOrder(Number(id));
        res.status(statusCode).json({
            statusCode,
            message,
            data,
        });
    }

    @Roles('admin', 'cliente')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post('upload-comprobante')
    @ApiOperation({ summary: 'Upload payment receipt for an order' })
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 200, description: 'File uploaded successfully' })
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (_req, _file, cb) => {
                cb(null, uploadsDir);
            },
            filename: (_req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = extname(file.originalname);
                cb(null, `comprobante-${uniqueSuffix}${ext}`);
            },
        }),
        fileFilter: (_req, file, cb) => {
            const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Solo se permiten archivos JPG, PNG, WEBP o PDF'), false);
            }
        },
        limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
    }))
    async uploadComprobante(
        @UploadedFile() file: File,
        @Query('order_id') orderId: string,
        @Res() res: Response,
    ) {
        if (!file) {
            console.log('[UPLOAD] No se recibió archivo');
            return res.status(400).json({ message: 'No se envió ningún archivo' });
        }

        const fileUrl = `comprobantes/${file.filename}`;
        console.log(`[UPLOAD] Archivo recibido: ${file.filename}, orderId: ${orderId}, fileUrl: ${fileUrl}`);

        // Guardar la URL en la orden
        if (orderId) {
            try {
                const result = await this.ordersService.updateOrder(Number(orderId), { comprobante_url: fileUrl });
                console.log(`[UPLOAD] Orden ${orderId} actualizada con comprobante:`, result);
            } catch (error) {
                console.error('[UPLOAD] Error al guardar comprobante en la orden:', error);
            }
        } else {
            console.log('[UPLOAD] No se recibió order_id');
        }

        return res.status(200).json({
            message: 'Comprobante subido exitosamente',
            url: fileUrl,
        });
    }
}

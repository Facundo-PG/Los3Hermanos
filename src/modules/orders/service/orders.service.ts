import { Injectable } from '@nestjs/common';
import { ResponseTemplate } from '../../../helpers/response.template';
import { OrdersRepository } from '../repository/orders.repository';
import { IOrdersService } from './interfaces/orders.services.interfaces';
import { CreateOrderDto } from '../repository/dto/create.orders.dto';
import { PaginationRequestListDto } from '../../../helpers/paginationParams.dto';
import { UpdateOrderDto } from '../repository/dto/update.orders.dto';

@Injectable()
export class OrdersService implements IOrdersService {
    constructor(private readonly ordersRepository: OrdersRepository) { }

    async createOrder(data: CreateOrderDto): Promise<ResponseTemplate> {
        try {
            const newOrder = await this.ordersRepository.createOrder(data);
            return new ResponseTemplate(201, "Order created successfully", newOrder);
        } catch (error) {
            const errMsg =
                error instanceof Error
                    ? error.message
                    : "Error al crear la orden";
            return new ResponseTemplate(500, "Internal Server Error", {
                mensajeError: errMsg,
            });
        }
    }

    async listOrders(
        options: PaginationRequestListDto,
    ): Promise<ResponseTemplate> {
        try {
            const orders = await this.ordersRepository.listOrders(options);
            return new ResponseTemplate(200, "List orders success", orders);
        } catch (error) {
            const errMsg =
                error instanceof Error
                    ? error.message
                    : "Error al obtener las órdenes del sistema";
            return new ResponseTemplate(500, "Internal Server Error", {
                mensajeError: errMsg,
            });
        }
    }

    async updateOrder(id: number, data: UpdateOrderDto): Promise<ResponseTemplate> {
        try {
            const updatedOrder = await this.ordersRepository.updateOrder(id, data);
            if (!updatedOrder) {
                return new ResponseTemplate(404, "Order not found", null);
            }
            return new ResponseTemplate(200, "Order updated successfully", updatedOrder);
        } catch (error) {
            const errMsg =
                error instanceof Error
                    ? error.message
                    : "Error al actualizar la orden";
            return new ResponseTemplate(500, "Internal Server Error", {
                mensajeError: errMsg,
            });
        }
    }

    async getDashboard(): Promise<ResponseTemplate> {
        try {
            const dashboardData = await this.ordersRepository.getDashboard();
            return new ResponseTemplate(200, "Dashboard data retrieved successfully", dashboardData);
        } catch (error) {
            const errMsg =
                error instanceof Error
                    ? error.message
                    : "Error al obtener datos del dashboard";
            return new ResponseTemplate(500, "Internal Server Error", {
                mensajeError: errMsg,
            });
        }
    }
}

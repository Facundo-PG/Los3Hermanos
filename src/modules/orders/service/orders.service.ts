import { Injectable } from '@nestjs/common';
import { ResponseTemplate } from '../../../helpers/response.template';
import { OrdersRepository } from '../repository/orders.repository';
import { IOrdersService } from './interfaces/orders.services.interfaces';
import { CreateOrderDto } from '../repository/dto/create.orders.dto';
import { PaginationRequestListDto } from '../../../helpers/paginationParams.dto';
import { UpdateOrderDto } from '../repository/dto/update.orders.dto';
import { NotificationsService } from '../../notifications/service/notifications.service';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class OrdersService implements IOrdersService {
    constructor(
        private readonly ordersRepository: OrdersRepository,
        private readonly notificationsService: NotificationsService,
        private readonly prisma: PrismaService,
    ) { }

    async createOrder(data: CreateOrderDto): Promise<ResponseTemplate> {
        try {
            const newOrder = await this.ordersRepository.createOrder(data);

            // Notificar a todos los admins sobre el nuevo pedido
            if (newOrder) {
                try {
                    await this.notificationsService.sendNewOrderNotificationToAdmins(
                        newOrder.id,
                        newOrder.users?.nombre || 'Cliente',
                        Number(newOrder.total) || 0,
                    );
                } catch (notifError) {
                    console.error('Error al notificar a admins:', notifError);
                    // No fallar la creación si falla la notificación
                }
            }

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
            console.log(`[UPDATE ORDER] Iniciando actualización de orden ${id} con estado ${data.estado}`);

            // Obtener orden actual para comparar estado
            const currentOrder = await this.prisma.orders.findUnique({
                where: { id },
                select: { estado: true },
            });

            const updatedOrder = await this.ordersRepository.updateOrder(id, data);
            if (!updatedOrder) {
                return new ResponseTemplate(404, "Order not found", null);
            }

            // Enviar notificación por email SOLO si el estado cambió
            const estadoCambio = data.estado && currentOrder && currentOrder.estado !== data.estado;
            if (estadoCambio && updatedOrder.users?.email) {
                console.log(`[EMAIL NOTIFICATION] Estado cambió de ${currentOrder.estado} a ${data.estado}. Enviando email a ${updatedOrder.users.email}`);
                try {
                    await this.notificationsService.sendOrderStatusEmail({
                        order_id: updatedOrder.id,
                        estado: data.estado as string,
                        email: updatedOrder.users.email,
                        nombre: updatedOrder.users.nombre || 'Cliente',
                    });
                    console.log(`[EMAIL NOTIFICATION] Email enviado exitosamente`);
                } catch (notifError) {
                    console.error('Error al enviar notificación por email:', notifError);
                    // No fallar la actualización si falla la notificación
                }
            } else if (data.estado && currentOrder && currentOrder.estado === data.estado) {
                console.log(`[EMAIL NOTIFICATION] Estado no cambió (sigue siendo ${currentOrder.estado}). No se envía email.`);
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

    async deleteOrder(id: number): Promise<ResponseTemplate> {
        try {
            const deletedOrder = await this.ordersRepository.deleteOrder(id);
            if (!deletedOrder) {
                return new ResponseTemplate(404, "Order not found", null);
            }
            return new ResponseTemplate(200, "Order deleted successfully", deletedOrder);
        } catch (error) {
            const errMsg =
                error instanceof Error
                    ? error.message
                    : "Error al eliminar la orden";
            return new ResponseTemplate(500, "Internal Server Error", {
                mensajeError: errMsg,
            });
        }
    }
}

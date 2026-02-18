import { CreateOrderDto } from '../dto/create.orders.dto';
import {
    PaginationRequestListDto,
    PaginationResult,
} from '../../../../helpers/paginationParams.dto';
import { orders } from '@prisma/client';
import { UpdateOrderDto } from '../dto/update.orders.dto';
import { DashboardData } from '../dto/dashboard.dto';

export interface IOrdersRepository {
    createOrder(data: CreateOrderDto): Promise<any>;
    listOrders(
        options?: PaginationRequestListDto,
    ): Promise<PaginationResult<orders[]>>;
    updateOrder(id: number, data: UpdateOrderDto): Promise<any>;
    getDashboard(): Promise<DashboardData>;
}

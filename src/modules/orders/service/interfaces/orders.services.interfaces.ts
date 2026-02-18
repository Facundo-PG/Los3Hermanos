import { ResponseTemplate } from '../../../../helpers/response.template';
import { CreateOrderDto } from '../../repository/dto/create.orders.dto';
import { PaginationRequestListDto } from '../../../../helpers/paginationParams.dto';
import { UpdateOrderDto } from '../../repository/dto/update.orders.dto';

export interface IOrdersService {
    createOrder(data: CreateOrderDto): Promise<ResponseTemplate>;
    listOrders(
        options: PaginationRequestListDto,
    ): Promise<ResponseTemplate>;
    updateOrder(id: number, data: UpdateOrderDto): Promise<ResponseTemplate>;
    getDashboard(): Promise<ResponseTemplate>;
    deleteOrder(id: number): Promise<ResponseTemplate>;
}

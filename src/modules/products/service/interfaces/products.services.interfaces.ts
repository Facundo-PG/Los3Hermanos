import {
    PaginationRequestListDto,
} from '../../../../helpers/paginationParams.dto';
import { ResponseTemplate } from '../../../../helpers/response.template';
import { CreateProductDto } from '../../repository/dto/create.products.dto';
import { UpdateProductDto } from '../../repository/dto/update.products.dto';

export interface IProductsService {
    listProducts(
        options: PaginationRequestListDto,
    ): Promise<ResponseTemplate>;
    getProductById(id: number): Promise<ResponseTemplate>;
    createProduct(data: CreateProductDto): Promise<ResponseTemplate>;
    updateProduct(id: number, data: UpdateProductDto): Promise<ResponseTemplate>;
    deleteProduct(id: number): Promise<ResponseTemplate>;
}

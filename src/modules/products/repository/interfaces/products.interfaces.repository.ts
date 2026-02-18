import { products } from '@prisma/client';
import {
    PaginationRequestListDto,
    PaginationResult,
} from '../../../../helpers/paginationParams.dto';
import { CreateProductDto } from '../dto/create.products.dto';
import { UpdateProductDto } from '../dto/update.products.dto';

export interface IProductsRepository {
    listProducts(
        options?: PaginationRequestListDto,
    ): Promise<PaginationResult<products[]>>;
    getProductById(id: number): Promise<products | null>;
    createProduct(data: CreateProductDto): Promise<products>;
    updateProduct(id: number, data: UpdateProductDto): Promise<products | null>;
    deleteProduct(id: number): Promise<products | null>;
}

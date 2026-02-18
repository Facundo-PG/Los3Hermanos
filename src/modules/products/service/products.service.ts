import { Injectable } from '@nestjs/common';
import {
    PaginationRequestListDto,
} from '../../../helpers/paginationParams.dto';
import { ResponseTemplate } from '../../../helpers/response.template';
import { ProductsRepository } from '../repository/products.repository';
import { IProductsService } from './interfaces/products.services.interfaces';
import { CreateProductDto } from '../repository/dto/create.products.dto';
import { UpdateProductDto } from '../repository/dto/update.products.dto';

@Injectable()
export class ProductsService implements IProductsService {
    constructor(private readonly productsRepository: ProductsRepository) { }

    async listProducts(
        options: PaginationRequestListDto,
    ): Promise<ResponseTemplate> {
        try {
            const products = await this.productsRepository.listProducts(options);
            return new ResponseTemplate(200, "List products success", products);
        } catch (error) {
            const errMsg =
                error instanceof Error
                    ? error.message
                    : "Error al obtener los productos cargados del sistema";
            return new ResponseTemplate(500, "Internal Server Error", {
                mensajeError: errMsg,
            });
        }
    }

    async getProductById(id: number): Promise<ResponseTemplate> {
        try {
            const product = await this.productsRepository.getProductById(id);
            if (!product) {
                return new ResponseTemplate(404, "Product not found", null);
            }
            return new ResponseTemplate(200, "Get product by ID success", product);
        } catch (error) {
            const errMsg =
                error instanceof Error
                    ? error.message
                    : "Error al obtener el producto por ID";
            return new ResponseTemplate(500, "Internal Server Error", {
                mensajeError: errMsg,
            });
        }
    }

    async createProduct(data: CreateProductDto): Promise<ResponseTemplate> {
        try {
            const newProduct = await this.productsRepository.createProduct(data);
            return new ResponseTemplate(201, "Product created successfully", newProduct);
        } catch (error) {
            const errMsg =
                error instanceof Error
                    ? error.message
                    : "Error al crear el producto";
            return new ResponseTemplate(500, "Internal Server Error", {
                mensajeError: errMsg,
            });
        }
    }

    async updateProduct(id: number, data: UpdateProductDto): Promise<ResponseTemplate> {
        try {
            const updatedProduct = await this.productsRepository.updateProduct(id, data);
            if (!updatedProduct) {
                return new ResponseTemplate(404, "Product not found", null);
            }
            return new ResponseTemplate(200, "Product updated successfully", updatedProduct);
        } catch (error) {
            const errMsg =
                error instanceof Error
                    ? error.message
                    : "Error al actualizar el producto";
            return new ResponseTemplate(500, "Internal Server Error", {
                mensajeError: errMsg,
            });
        }
    }

    async deleteProduct(id: number): Promise<ResponseTemplate> {
        try {
            const deletedProduct = await this.productsRepository.deleteProduct(id);
            if (!deletedProduct) {
                return new ResponseTemplate(404, "Product not found", null);
            }
            return new ResponseTemplate(200, "Product deleted successfully", deletedProduct);
        } catch (error) {
            const errMsg =
                error instanceof Error
                    ? error.message
                    : "Error al eliminar el producto";
            return new ResponseTemplate(500, "Internal Server Error", {
                mensajeError: errMsg,
            });
        }
    }
}

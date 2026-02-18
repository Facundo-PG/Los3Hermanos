import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import {
    PaginationRequestListDto,
    PaginationResult,
} from '../../../helpers/paginationParams.dto';
import { products } from '@prisma/client';
import { IProductsRepository } from './interfaces/products.interfaces.repository';
import { CreateProductDto } from './dto/create.products.dto';
import { UpdateProductDto } from './dto/update.products.dto';

@Injectable()
export class ProductsRepository implements IProductsRepository {
    constructor(private readonly prisma: PrismaService) { }

    async listProducts(
        options?: PaginationRequestListDto,
    ): Promise<PaginationResult<products[]>> {
        try {
            const { sortBy, search } = options || {};
            const items = Number(options?.items) || 1;

            const itemsPerPage =
                Number(options?.itemsPerPage) ||
                (await this.prisma.products.count());

            const where: any = {};

            if (search) {
                where.OR = [
                    {
                        nombre: {
                            contains: search,
                            mode: 'insensitive', // 🔥 CLAVE
                        },
                    },
                    {
                        descripcion: {
                            contains: search,
                            mode: 'insensitive', // 🔥 CLAVE
                        },
                    },
                ];
            }

            const total = await this.prisma.products.count({ where });

            const data = await this.prisma.products.findMany({
                where,
                skip: (items - 1) * itemsPerPage,
                take: itemsPerPage,
                orderBy: {
                    nombre: sortBy === 'asc' ? 'asc' : 'desc',
                },
                include: {
                    categories: true,
                    order_items: true,
                    stock_movements: true,
                },
            });

            return {
                totalData: total,
                items,
                itemsPerPage,
                data,
            };
        } catch (error) {
            console.error('Error al obtener el listado de productos:', error);
            throw new Error(
                `Error al obtener el listado de productos: ${error.message}`,
            );
        }
    }

    async getProductById(id: number): Promise<products | null> {
        try {
            const product = await this.prisma.products.findUnique({
                where: { id },
                include: {
                    categories: true,
                    order_items: true,
                    stock_movements: true,
                },
            });
            return product;
        } catch (error) {
            console.error('Error al obtener el producto por ID:', error);
            throw new Error(
                `Error al obtener el producto por ID: ${error.message}`,
            );
        }
    }

    async createProduct(data: CreateProductDto): Promise<products> {
        try {
            const newProduct = await this.prisma.products.create({
                data: {
                    category_id: data.category_id,
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                    precio: data.precio,
                    stock: data.stock || 0,
                    imagen_url: data.imagen_url,
                    activo: data.activo ?? true,
                },
                include: {
                    categories: true,
                    order_items: true,
                    stock_movements: true,
                },
            });
            return newProduct;
        } catch (error) {
            console.error('Error al crear el producto:', error);
            throw new Error(
                `Error al crear el producto: ${error.message}`,
            );
        }
    }

    async updateProduct(id: number, data: UpdateProductDto): Promise<products | null> {
        try {
            const existingProduct = await this.prisma.products.findUnique({
                where: { id },
            });

            if (!existingProduct) {
                throw new Error("El producto ingresado no existe, por lo tanto no se puede actualizar.");
            }

            const updatedProduct = await this.prisma.products.update({
                where: { id },
                data: {
                    category_id: data.category_id,
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                    precio: data.precio,
                    stock: data.stock,
                    imagen_url: data.imagen_url,
                    activo: data.activo,
                },
                include: {
                    categories: true,
                    order_items: true,
                    stock_movements: true,
                },
            });
            return updatedProduct;
        } catch (error) {
            console.error('Error al actualizar el producto:', error);
            throw new Error(
                `Error al actualizar el producto: ${error.message}`,
            );
        }
    }

    async deleteProduct(id: number): Promise<products | null> {
        try {
            const existingProduct = await this.prisma.products.findUnique({
                where: { id },
            });

            if (!existingProduct) {
                throw new Error("El producto ingresado no existe, por lo tanto no se puede eliminar.");
            }

            const deletedProduct = await this.prisma.products.delete({
                where: { id },
            });
            return deletedProduct;
        } catch (error) {
            console.error('Error al eliminar el producto:', error);
            throw new Error(
                `Error al eliminar el producto: ${error.message}`,
            );
        }
    }
}

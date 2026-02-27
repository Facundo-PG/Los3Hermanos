import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { IOrdersRepository } from './interfaces/orders.interfaces.repository';
import { CreateOrderDto } from './dto/create.orders.dto';
import {
    PaginationRequestListDto,
    PaginationResult,
} from '../../../helpers/paginationParams.dto';
import { orders } from '@prisma/client';
import { UpdateOrderDto } from './dto/update.orders.dto';
import { DashboardData } from './dto/dashboard.dto';

@Injectable()
export class OrdersRepository implements IOrdersRepository {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Detecta si un producto es promoción y extrae los kg del nombre/descripción.
     * Ej: "Promo 3kg de Alas" → 3, "Promoción 5kg Pata Muslo" → 5
     * Si no es promo o no tiene kg, retorna 1 (descuento normal por unidad).
     */
    private getStockMultiplier(nombre: string, descripcion?: string | null): number {
        const text = `${nombre} ${descripcion || ''}`;
        // Solo aplica a productos con "promocion/promoción" en nombre o descripción
        if (!/promoci[oó]n/i.test(text)) return 1;
        // Extraer kg: "3kg", "3 kg", "3.5kg", "3,5 kg"
        const match = text.match(/(\d+(?:[.,]\d+)?)\s*kg/i);
        if (match) return parseFloat(match[1].replace(',', '.'));
        return 1;
    }

    async createOrder(data: CreateOrderDto): Promise<any> {
        try {
            // 1. Verificar si el local está abierto
            const settings = await this.prisma.settings.findFirst();

            if (!settings || !settings.esta_abierto) {
                const mensaje = settings?.mensaje_alerta || 'El local está cerrado en este momento. No se pueden realizar pedidos.';
                throw new Error(mensaje);
            }

            // 2. Verificar stock y obtener precios reales
            const productsData = await Promise.all(
                data.items.map(async (item) => {
                    const product = await this.prisma.products.findUnique({
                        where: { id: item.product_id },
                    });

                    if (!product) {
                        throw new Error(`Producto con ID ${item.product_id} no existe`);
                    }

                    if (!product.activo) {
                        throw new Error(`Producto ${product.nombre} no está activo`);
                    }

                    // Para promos: cada unidad consume X kg de stock
                    const multiplier = this.getStockMultiplier(product.nombre, product.descripcion);
                    const stockADescontar = item.cantidad * multiplier;

                    const stockActual = Number(product.stock) || 0;
                    if (stockActual < stockADescontar) {
                        throw new Error(
                            `Stock insuficiente para ${product.nombre}. Stock disponible: ${stockActual} kg, solicitado: ${stockADescontar} kg`,
                        );
                    }

                    return {
                        product_id: item.product_id,
                        cantidad: item.cantidad,
                        precio_unitario: Number(product.precio),
                        nombre: product.nombre,
                        stockADescontar, // kg reales a descontar
                    };
                }),
            );

            // 3. Calcular total usando precios reales
            const total = productsData.reduce(
                (sum, item) => sum + item.precio_unitario * item.cantidad,
                0,
            );

            // 4. Usar transacción para crear todo en cascada
            const result = await this.prisma.$transaction(async (prisma) => {
                // 4.1 Crear orden
                const newOrder = await prisma.orders.create({
                    data: {
                        user_id: data.user_id,
                        total,
                        estado: 'pendiente',
                        tipo_entrega: data.tipo_entrega,
                        notas: data.notas,
                        metodo_pago: data.metodo_pago,
                        comprobante_url: data.comprobante_url,
                    },
                });

                // 4.2 Crear order_items
                await Promise.all(
                    productsData.map((item) =>
                        prisma.order_items.create({
                            data: {
                                order_id: newOrder.id,
                                product_id: item.product_id,
                                cantidad: item.cantidad,
                                precio_unitario: item.precio_unitario,
                            },
                        }),
                    ),
                );

                // 4.3 Actualizar stock (promos descuentan los kg reales)
                await Promise.all(
                    productsData.map((item) =>
                        prisma.products.update({
                            where: { id: item.product_id },
                            data: {
                                stock: {
                                    decrement: item.stockADescontar,
                                },
                            },
                        }),
                    ),
                );

                // 4.4 Crear stock_movements (registrar kg reales descontados)
                await Promise.all(
                    productsData.map((item) =>
                        prisma.stock_movements.create({
                            data: {
                                product_id: item.product_id,
                                cantidad: -item.stockADescontar,
                                tipo: 'venta',
                                motivo: `Pedido #${newOrder.id}${item.stockADescontar !== item.cantidad ? ` (${item.cantidad} unidad(es) x ${item.stockADescontar / item.cantidad}kg)` : ''}`,
                            },
                        }),
                    ),
                );

                // Retornar orden con relaciones
                return await prisma.orders.findUnique({
                    where: { id: newOrder.id },
                    include: {
                        order_items: {
                            include: {
                                products: true,
                            },
                        },
                        users: {
                            select: {
                                id: true,
                                nombre: true,
                                email: true,
                                telefono: true,
                                direccion: true,
                            },
                        },
                    },
                });
            });

            if (!result) {
                throw new Error('Error al crear la orden');
            }

            return result;
        } catch (error) {
            console.error('Error al crear la orden:', error);
            throw new Error(`Error al crear la orden: ${error.message}`);
        }
    }

    async listOrders(
        options?: PaginationRequestListDto,
    ): Promise<PaginationResult<orders[]>> {
        try {
            const { sortBy, search, dateFrom, dateTo } = options || {};
            const items: number = Number(options?.items) || 1;

            const itemsPerPage: number =
                Number(options?.itemsPerPage) ||
                (await this.prisma.orders.count());

            const where: any = {};

            // Date filter (Argentina UTC-3)
            if (dateFrom || dateTo) {
                where.created_at = {};
                if (dateFrom) {
                    where.created_at.gte = new Date(`${dateFrom}T00:00:00-03:00`);
                }
                if (dateTo) {
                    where.created_at.lte = new Date(`${dateTo}T23:59:59.999-03:00`);
                }
            }

            if (search) {
                where.OR = [
                    {
                        estado: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        tipo_entrega: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        metodo_pago: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        users: {
                            nombre: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                    },
                ];
            }

            const total = await this.prisma.orders.count({ where });

            const data = await this.prisma.orders.findMany({
                where,
                skip: (items - 1) * itemsPerPage,
                take: itemsPerPage,
                orderBy: {
                    created_at: sortBy === 'desc' ? 'desc' : 'asc',
                },
                include: {
                    order_items: {
                        include: {
                            products: true,
                        },
                    },
                    users: {
                        select: {
                            id: true,
                            nombre: true,
                            email: true,
                            telefono: true,
                            direccion: true,
                        },
                    },
                },
            });

            return {
                totalData: total,
                items,
                itemsPerPage,
                data,
            };
        } catch (error) {
            console.error('Error al obtener el listado de órdenes:', error);
            throw new Error(
                `Error al obtener el listado de órdenes: ${error.message}`,
            );
        }
    }

    async updateOrder(id: number, data: UpdateOrderDto): Promise<any> {
        try {
            const existingOrder = await this.prisma.orders.findUnique({
                where: { id },
            });

            if (!existingOrder) {
                throw new Error(`Orden con ID ${id} no existe`);
            }

            const updatedOrder = await this.prisma.orders.update({
                where: { id },
                data: {
                    estado: data.estado,
                    tipo_entrega: data.tipo_entrega,
                    notas: data.notas,
                    metodo_pago: data.metodo_pago,
                    comprobante_url: data.comprobante_url,
                },
                include: {
                    order_items: {
                        include: {
                            products: true,
                        },
                    },
                    users: {
                        select: {
                            id: true,
                            nombre: true,
                            email: true,
                            telefono: true,
                            direccion: true,
                        },
                    },
                },
            });
            return updatedOrder;
        } catch (error) {
            console.error('Error al actualizar la orden:', error);
            throw new Error(
                `Error al actualizar la orden: ${error.message}`,
            );
        }
    }

    async getDashboard(): Promise<DashboardData> {
        try {
            // 1. Ventas Totales de Hoy
            const inicioDelDia = new Date();
            inicioDelDia.setHours(0, 0, 0, 0);

            const finDelDia = new Date();
            finDelDia.setHours(23, 59, 59, 999);

            const ventasHoy = await this.prisma.orders.aggregate({
                _sum: {
                    total: true,
                },
                where: {
                    created_at: {
                        gte: inicioDelDia,
                        lte: finDelDia,
                    },
                },
            });

            // 2. Cantidad de Pedidos Pendientes
            const pedidosPendientes = await this.prisma.orders.count({
                where: {
                    estado: {
                        in: ['pendiente', 'en_proceso', 'en_camino'],
                    },
                },
            });

            // 3. Productos más vendidos (Top 5)
            const productosMasVendidos = await this.prisma.order_items.groupBy({
                by: ['product_id'],
                _sum: {
                    cantidad: true,
                },
                orderBy: {
                    _sum: {
                        cantidad: 'desc',
                    },
                },
                take: 5,
            });

            // Obtener nombres de productos
            const productosConNombres = await Promise.all(
                productosMasVendidos
                    .filter((item) => item.product_id !== null)
                    .map(async (item) => {
                        const producto = await this.prisma.products.findUnique({
                            where: { id: item.product_id as number },
                            select: { nombre: true },
                        });
                        return {
                            product_id: item.product_id as number,
                            nombre: producto?.nombre || 'Desconocido',
                            cantidad_vendida: Number(item._sum.cantidad) || 0,
                        };
                    }),
            );

            // 4. Stock Crítico (menos de 10 kg)
            const stockCritico = await this.prisma.products.findMany({
                where: {
                    stock: {
                        lte: 10,
                    },
                    activo: true,
                },
                select: {
                    id: true,
                    nombre: true,
                    stock: true,
                },
                orderBy: {
                    stock: 'asc',
                },
            });

            // 5. Precio Promedio de productos activos
            const precioPromedio = await this.prisma.products.aggregate({
                _avg: {
                    precio: true,
                },
                where: {
                    activo: true,
                },
            });

            // 6. Stock Total de productos activos
            const stockTotal = await this.prisma.products.aggregate({
                _sum: {
                    stock: true,
                },
                where: {
                    activo: true,
                },
            });

            return {
                ventas_totales_hoy: Number(ventasHoy._sum.total) || 0,
                pedidos_pendientes: pedidosPendientes,
                productos_mas_vendidos: productosConNombres,
                stock_critico: stockCritico.map((p) => ({
                    id: p.id,
                    nombre: p.nombre,
                    stock: Number(p.stock),
                })),
                precio_promedio: Number(precioPromedio._avg.precio) || 0,
                stock_total: Number(stockTotal._sum.stock) || 0,
            };
        } catch (error) {
            console.error('Error al obtener datos del dashboard:', error);
            throw new Error(
                `Error al obtener datos del dashboard: ${error.message}`,
            );
        }
    }

    async deleteOrder(id: number): Promise<orders | null> {
        try {
            const existingOrder = await this.prisma.orders.findUnique({
                where: { id },
            });

            if (!existingOrder) {
                throw new Error('La orden ingresada no existe, por lo tanto no se puede eliminar.');
            }

            const deletedOrder = await this.prisma.orders.delete({
                where: { id },
            });
            return deletedOrder;
        } catch (error) {
            console.error('Error al eliminar la orden:', error);
            throw new Error(
                `Error al eliminar la orden: ${error.message}`,
            );
        }
    }
}

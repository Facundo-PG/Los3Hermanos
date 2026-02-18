export interface DashboardData {
    ventas_totales_hoy: number;
    pedidos_pendientes: number;
    productos_mas_vendidos: ProductoVendido[];
    stock_critico: StockCritico[];
    precio_promedio: number;
    stock_total: number;
}

export interface ProductoVendido {
    product_id: number;
    nombre: string;
    cantidad_vendida: number;
}

export interface StockCritico {
    id: number;
    nombre: string;
    stock: number;
}

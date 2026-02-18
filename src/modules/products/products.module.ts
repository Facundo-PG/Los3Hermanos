import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './service/products.service';
import { ProductsRepository } from './repository/products.repository';
import { PrismaModule } from '../../prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ProductsController],
    providers: [ProductsService, ProductsRepository],
    exports: [ProductsService, ProductsRepository],
})
export class ProductsModule { }

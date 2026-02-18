import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './service/orders.service';
import { OrdersRepository } from './repository/orders.repository';
import { PrismaModule } from '../../prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, NotificationsModule],
    controllers: [OrdersController],
    providers: [OrdersService, OrdersRepository],
    exports: [OrdersService, OrdersRepository],
})
export class OrdersModule { }

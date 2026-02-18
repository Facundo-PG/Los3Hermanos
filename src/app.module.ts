import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config'; // Importá esto
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true, // Esto hace que el .env esté disponible en todos lados
  }), // Esto hace que las variables de entorno se carguen en toda la app
    PrismaModule, AuthModule, ProductsModule, OrdersModule, SettingsModule, NotificationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

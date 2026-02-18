import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common'; // Importá esto
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // Importá esto

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Agregá esta línea para que funcionen los DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,    // Elimina campos que no estén en el DTO
    forbidNonWhitelisted: true, // Lanza error si mandan campos extra
    transform: true,    // Transforma los tipos automáticamente
  }));

  // CONFIGURACIÓN DE SWAGGER
  const config = new DocumentBuilder()
    .setTitle('Pollería "Los Tres Hermanos" - API')
    .setDescription('Sistema de gestión de inventario y pedidos para la pollería')
    .setVersion('1.0')
    .addTag('Auth') // Grupos de endpoints
    .addBearerAuth() // Esto servirá más adelante para el JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // La URL será http://localhost:3000/api

  await app.listen(3000);
}
bootstrap();
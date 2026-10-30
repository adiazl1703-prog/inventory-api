import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Inventory API / API de Inventario')
    .setDescription(
      'Manages the lifecycle of IT equipment, employees and assignment tracking.\n\n' +
        'Gestiona el ciclo de vida de los equipos de cómputo, los empleados y el seguimiento de asignaciones.',
    )
    .setVersion('1.0')
    .addTag(
      'Equipments / Equipos',
      'IT equipment inventory / Inventario de equipos de cómputo',
    )
    .addTag(
      'Employees / Empleados',
      'Employee registry / Registro de empleados',
    )
    .addTag(
      'Assignments / Asignaciones',
      'Assignment and return log / Registro de asignaciones y devoluciones',
    )
    .build();
  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();

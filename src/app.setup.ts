import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter.js';

export const API_PREFIX = 'api/v1';

// Shared by main.ts and the e2e suite so tests run with the production pipeline.
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());
}

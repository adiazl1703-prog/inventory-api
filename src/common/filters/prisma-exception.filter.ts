import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

// Translates database constraint errors into HTTP responses. This is also the
// safety net for races, e.g. the unique index rejecting a concurrent assignment.
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const { statusCode, error, message } = this.toHttpError(exception);
    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`${exception.code}: ${exception.message}`);
    }
    host.switchToHttp().getResponse<Response>().status(statusCode).json({
      statusCode,
      error,
      message,
    });
  }

  private toHttpError(exception: Prisma.PrismaClientKnownRequestError) {
    switch (exception.code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: 'A record with the same unique value already exists',
        };
      case 'P2003':
        return {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message:
            'The operation references a record that does not exist or is still in use',
        };
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: 'Record not found',
        };
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Internal Server Error',
          message: 'Internal server error',
        };
    }
  }
}

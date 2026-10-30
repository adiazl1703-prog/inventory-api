import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { EquipmentsModule } from './equipments/equipments.module.js';
import { EmployeesModule } from './employees/employees.module.js';
import { AssignmentsModule } from './assignments/assignments.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EquipmentsModule,
    EmployeesModule,
    AssignmentsModule,
  ],
})
export class AppModule {}

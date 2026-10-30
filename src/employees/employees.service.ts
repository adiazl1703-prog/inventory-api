import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateEmployeeDto) {
    return this.prisma.employee.create({ data: dto });
  }

  async findAll({ page, limit }: PaginationQueryDto) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.employee.count(),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    return employee;
  }

  async findCurrentEquipment(id: string) {
    await this.findOne(id);
    return this.prisma.assignment.findMany({
      where: { employeeId: id, returnedAt: null },
      include: { equipment: true },
      orderBy: { assignedAt: 'desc' },
    });
  }
}

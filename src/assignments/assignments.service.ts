import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EquipmentStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAssignmentDto } from './dto/create-assignment.dto.js';
import { ReturnAssignmentDto } from './dto/return-assignment.dto.js';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  assign({ equipmentId, employeeId, notes }: CreateAssignmentDto) {
    return this.prisma.$transaction(async (tx) => {
      const equipment = await tx.equipment.findUnique({
        where: { id: equipmentId },
      });
      if (!equipment) {
        throw new NotFoundException(`Equipment ${equipmentId} not found`);
      }
      const employee = await tx.employee.findUnique({
        where: { id: employeeId },
      });
      if (!employee) {
        throw new NotFoundException(`Employee ${employeeId} not found`);
      }
      if (equipment.status !== EquipmentStatus.available) {
        throw new ConflictException(
          `Equipment is not available (current status: ${equipment.status})`,
        );
      }

      // The status condition makes concurrent requests for the same unit race
      // safely: only one of them matches the row.
      const { count } = await tx.equipment.updateMany({
        where: { id: equipmentId, status: EquipmentStatus.available },
        data: { status: EquipmentStatus.assigned },
      });
      if (count === 0) {
        throw new ConflictException('Equipment was assigned concurrently');
      }

      return tx.assignment.create({
        data: {
          equipmentId,
          employeeId,
          assignedAt: new Date(),
          assignmentNotes: notes,
        },
        include: { equipment: true, employee: true },
      });
    });
  }

  registerReturn(id: string, { notes }: ReturnAssignmentDto) {
    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.assignment.findUnique({ where: { id } });
      if (!assignment) {
        throw new NotFoundException(`Assignment ${id} not found`);
      }

      const { count } = await tx.assignment.updateMany({
        where: { id, returnedAt: null },
        data: { returnedAt: new Date(), returnNotes: notes },
      });
      if (count === 0) {
        throw new ConflictException('Assignment has already been returned');
      }

      await tx.equipment.update({
        where: { id: assignment.equipmentId },
        data: { status: EquipmentStatus.available },
      });

      return tx.assignment.findUniqueOrThrow({
        where: { id },
        include: { equipment: true, employee: true },
      });
    });
  }

  async findOne(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: { equipment: true, employee: true },
    });
    if (!assignment) {
      throw new NotFoundException(`Assignment ${id} not found`);
    }
    return assignment;
  }
}

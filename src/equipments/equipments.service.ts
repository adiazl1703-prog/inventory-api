import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EquipmentStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEquipmentDto } from './dto/create-equipment.dto.js';
import { QueryEquipmentDto } from './dto/query-equipment.dto.js';
import { UpdateEquipmentDto } from './dto/update-equipment.dto.js';

@Injectable()
export class EquipmentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateEquipmentDto) {
    return this.prisma.equipment.create({ data: dto });
  }

  async findAll({ location, status, page, limit }: QueryEquipmentDto) {
    const where = { location, status };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.equipment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.equipment.count({ where }),
    ]);
    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const equipment = await this.prisma.equipment.findUnique({ where: { id } });
    if (!equipment) {
      throw new NotFoundException(`Equipment ${id} not found`);
    }
    return equipment;
  }

  async findHistoryBySerial(serialNumber: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { serialNumber },
      include: {
        assignments: {
          include: { employee: true },
          orderBy: { assignedAt: 'desc' },
        },
      },
    });
    if (!equipment) {
      throw new NotFoundException(
        `Equipment with serial number ${serialNumber} not found`,
      );
    }
    return equipment;
  }

  async update(id: string, dto: UpdateEquipmentDto) {
    const equipment = await this.findOne(id);
    if (equipment.status === EquipmentStatus.decommissioned) {
      throw new ConflictException(
        'Decommissioned equipment cannot be modified',
      );
    }
    if (
      dto.status &&
      dto.status !== equipment.status &&
      equipment.status === EquipmentStatus.assigned
    ) {
      throw new ConflictException(
        'Assigned equipment must be returned before changing its status',
      );
    }
    await this.applyIfStatusUnchanged(id, equipment.status, dto);
    return this.findOne(id);
  }

  async decommission(id: string) {
    const equipment = await this.findOne(id);
    if (equipment.status === EquipmentStatus.decommissioned) {
      throw new ConflictException('Equipment is already decommissioned');
    }
    if (equipment.status === EquipmentStatus.assigned) {
      throw new ConflictException(
        'Assigned equipment must be returned before decommissioning',
      );
    }
    await this.applyIfStatusUnchanged(id, equipment.status, {
      status: EquipmentStatus.decommissioned,
      decommissionedAt: new Date(),
    });
    return this.findOne(id);
  }

  // Guards against the equipment being assigned between the check and the write.
  private async applyIfStatusUnchanged(
    id: string,
    expectedStatus: EquipmentStatus,
    data: UpdateEquipmentDto & { decommissionedAt?: Date },
  ) {
    const { count } = await this.prisma.equipment.updateMany({
      where: { id, status: expectedStatus },
      data,
    });
    if (count === 0) {
      throw new ConflictException(
        'Equipment status changed concurrently, please retry',
      );
    }
  }
}

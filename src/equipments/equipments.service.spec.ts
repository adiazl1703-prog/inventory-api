import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EquipmentStatus, Location } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EquipmentsService } from './equipments.service.js';

const id = 'equipment-1';
const mockFn = () => jest.fn<(...args: any[]) => any>();

describe('EquipmentsService', () => {
  let service: EquipmentsService;
  const equipment = {
    findUnique: mockFn(),
    findMany: mockFn(),
    count: mockFn(),
    create: mockFn(),
    updateMany: mockFn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    equipment.updateMany.mockResolvedValue({ count: 1 });
    const prisma = {
      equipment,
      $transaction: (operations: unknown[]) => Promise.all(operations),
    };
    service = new EquipmentsService(prisma as unknown as PrismaService);
  });

  const withStatus = (status: EquipmentStatus) =>
    equipment.findUnique.mockResolvedValue({ id, status });

  describe('findAll', () => {
    it('filters by location and status and paginates', async () => {
      equipment.findMany.mockResolvedValue([{ id }]);
      equipment.count.mockResolvedValue(11);

      const result = await service.findAll({
        location: Location.Cartagena,
        status: EquipmentStatus.available,
        page: 2,
        limit: 5,
      });

      expect(equipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            location: Location.Cartagena,
            status: EquipmentStatus.available,
          },
          skip: 5,
          take: 5,
        }),
      );
      expect(result).toEqual({
        data: [{ id }],
        meta: { total: 11, page: 2, limit: 5 },
      });
    });
  });

  describe('findOne', () => {
    it('throws when the equipment does not exist', async () => {
      equipment.findUnique.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findHistoryBySerial', () => {
    it('returns assignments newest first', async () => {
      equipment.findUnique.mockResolvedValue({ id, assignments: [] });

      await service.findHistoryBySerial('SN-1');

      expect(equipment.findUnique).toHaveBeenCalledWith({
        where: { serialNumber: 'SN-1' },
        include: {
          assignments: {
            include: { employee: true },
            orderBy: { assignedAt: 'desc' },
          },
        },
      });
    });

    it('throws for an unknown serial number', async () => {
      equipment.findUnique.mockResolvedValue(null);

      await expect(service.findHistoryBySerial('SN-X')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('moves available equipment to repair', async () => {
      withStatus(EquipmentStatus.available);

      await service.update(id, { status: EquipmentStatus.in_repair });

      expect(equipment.updateMany).toHaveBeenCalledWith({
        where: { id, status: EquipmentStatus.available },
        data: { status: EquipmentStatus.in_repair },
      });
    });

    it('allows editing data of assigned equipment when status is untouched', async () => {
      withStatus(EquipmentStatus.assigned);

      await service.update(id, { location: Location.Bogota });

      expect(equipment.updateMany).toHaveBeenCalled();
    });

    it('rejects changing the status of assigned equipment', async () => {
      withStatus(EquipmentStatus.assigned);

      await expect(
        service.update(id, { status: EquipmentStatus.in_repair }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(equipment.updateMany).not.toHaveBeenCalled();
    });

    it('rejects modifying decommissioned equipment', async () => {
      withStatus(EquipmentStatus.decommissioned);

      await expect(
        service.update(id, { brand: 'Dell' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(equipment.updateMany).not.toHaveBeenCalled();
    });

    it('rejects the write when the status changed after it was read', async () => {
      withStatus(EquipmentStatus.available);
      equipment.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(id, { status: EquipmentStatus.in_repair }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('decommission', () => {
    it.each([EquipmentStatus.available, EquipmentStatus.in_repair])(
      'decommissions equipment in status %s with a timestamp',
      async (status) => {
        withStatus(status);

        await service.decommission(id);

        const { where, data } = equipment.updateMany.mock.calls[0][0];
        expect(where).toEqual({ id, status });
        expect(data.status).toBe(EquipmentStatus.decommissioned);
        expect(data.decommissionedAt).toBeInstanceOf(Date);
      },
    );

    it.each([EquipmentStatus.assigned, EquipmentStatus.decommissioned])(
      'rejects equipment in status %s',
      async (status) => {
        withStatus(status);

        await expect(service.decommission(id)).rejects.toBeInstanceOf(
          ConflictException,
        );
        expect(equipment.updateMany).not.toHaveBeenCalled();
      },
    );
  });
});

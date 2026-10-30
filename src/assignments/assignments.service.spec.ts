import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EquipmentStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AssignmentsService } from './assignments.service.js';

const equipmentId = 'equipment-1';
const employeeId = 'employee-1';

const mockFn = () => jest.fn<(...args: any[]) => any>();

function createPrismaMock() {
  const tx = {
    equipment: { findUnique: mockFn(), updateMany: mockFn(), update: mockFn() },
    employee: { findUnique: mockFn() },
    assignment: {
      findUnique: mockFn(),
      findUniqueOrThrow: mockFn(),
      create: mockFn(),
      updateMany: mockFn(),
    },
  };
  return {
    tx,
    prisma: {
      ...tx,
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    },
  };
}

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let tx: ReturnType<typeof createPrismaMock>['tx'];

  beforeEach(() => {
    const mock = createPrismaMock();
    tx = mock.tx;
    service = new AssignmentsService(mock.prisma as unknown as PrismaService);
  });

  describe('assign', () => {
    const dto = { equipmentId, employeeId, notes: 'With charger' };

    beforeEach(() => {
      tx.equipment.findUnique.mockResolvedValue({
        id: equipmentId,
        status: EquipmentStatus.available,
      });
      tx.employee.findUnique.mockResolvedValue({ id: employeeId });
      tx.equipment.updateMany.mockResolvedValue({ count: 1 });
      tx.assignment.create.mockResolvedValue({ id: 'assignment-1' });
    });

    it('marks the equipment as assigned and logs a timestamped assignment', async () => {
      const before = Date.now();

      await expect(service.assign(dto)).resolves.toEqual({
        id: 'assignment-1',
      });

      expect(tx.equipment.updateMany).toHaveBeenCalledWith({
        where: { id: equipmentId, status: EquipmentStatus.available },
        data: { status: EquipmentStatus.assigned },
      });
      const { data } = tx.assignment.create.mock.calls[0][0];
      expect(data).toMatchObject({
        equipmentId,
        employeeId,
        assignmentNotes: 'With charger',
      });
      expect(data.assignedAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('rejects unknown equipment', async () => {
      tx.equipment.findUnique.mockResolvedValue(null);

      await expect(service.assign(dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(tx.assignment.create).not.toHaveBeenCalled();
    });

    it('rejects unknown employees', async () => {
      tx.employee.findUnique.mockResolvedValue(null);

      await expect(service.assign(dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(tx.equipment.updateMany).not.toHaveBeenCalled();
    });

    it.each([
      EquipmentStatus.assigned,
      EquipmentStatus.in_repair,
      EquipmentStatus.decommissioned,
    ])('rejects equipment in status %s', async (status) => {
      tx.equipment.findUnique.mockResolvedValue({ id: equipmentId, status });

      await expect(service.assign(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(tx.assignment.create).not.toHaveBeenCalled();
    });

    it('rejects the request that loses a concurrent race', async () => {
      tx.equipment.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.assign(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(tx.assignment.create).not.toHaveBeenCalled();
    });
  });

  describe('registerReturn', () => {
    beforeEach(() => {
      tx.assignment.findUnique.mockResolvedValue({
        id: 'assignment-1',
        equipmentId,
      });
      tx.assignment.updateMany.mockResolvedValue({ count: 1 });
      tx.assignment.findUniqueOrThrow.mockResolvedValue({ id: 'assignment-1' });
    });

    it('closes the assignment and makes the equipment available again', async () => {
      const before = Date.now();

      await service.registerReturn('assignment-1', { notes: 'Good condition' });

      const { where, data } = tx.assignment.updateMany.mock.calls[0][0];
      expect(where).toEqual({ id: 'assignment-1', returnedAt: null });
      expect(data.returnNotes).toBe('Good condition');
      expect(data.returnedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(tx.equipment.update).toHaveBeenCalledWith({
        where: { id: equipmentId },
        data: { status: EquipmentStatus.available },
      });
    });

    it('rejects unknown assignments', async () => {
      tx.assignment.findUnique.mockResolvedValue(null);

      await expect(
        service.registerReturn('missing', {}),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('never overwrites the timestamp of a closed assignment', async () => {
      tx.assignment.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.registerReturn('assignment-1', {}),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(tx.equipment.update).not.toHaveBeenCalled();
    });
  });
});

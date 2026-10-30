import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/pagination.dto.js';
import { EmployeeResponseDto } from '../../employees/dto/employee-response.dto.js';
import { EquipmentStatus, Location } from '../../generated/prisma/enums.js';

export class EquipmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Serial number / Número de serie' })
  serialNumber: string;

  @ApiProperty({ description: 'Equipment type / Tipo de equipo' })
  type: string;

  @ApiProperty({ description: 'Brand / Marca' })
  brand: string;

  @ApiProperty({ description: 'Model / Modelo' })
  model: string;

  @ApiProperty({ description: 'Location / Ubicación', enum: Location })
  location: Location;

  @ApiProperty({ description: 'Status / Estado', enum: EquipmentStatus })
  status: EquipmentStatus;

  @ApiPropertyOptional({
    description: 'Decommission timestamp / Fecha y hora de baja',
    type: Date,
    nullable: true,
  })
  decommissionedAt: Date | null;

  @ApiProperty({ description: 'Creation timestamp / Fecha y hora de creación' })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp / Fecha y hora de actualización',
  })
  updatedAt: Date;
}

export class PaginatedEquipmentDto {
  @ApiProperty({ type: () => [EquipmentResponseDto] })
  data: EquipmentResponseDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class EquipmentHistoryEntryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    description: 'Assignment timestamp / Fecha y hora de asignación',
  })
  assignedAt: Date;

  @ApiPropertyOptional({
    description:
      'Return timestamp, null while still assigned / Fecha y hora de devolución, null mientras siga asignado',
    type: Date,
    nullable: true,
  })
  returnedAt: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  assignmentNotes: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  returnNotes: string | null;

  @ApiProperty({ type: () => EmployeeResponseDto })
  employee: EmployeeResponseDto;
}

export class EquipmentHistoryDto extends EquipmentResponseDto {
  @ApiProperty({
    description:
      'Complete assignment history, newest first / Historial completo de asignaciones, más reciente primero',
    type: () => [EquipmentHistoryEntryDto],
  })
  assignments: EquipmentHistoryEntryDto[];
}

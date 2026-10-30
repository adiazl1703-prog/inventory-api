import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EquipmentResponseDto } from '../../equipments/dto/equipment-response.dto.js';

export class AssignmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  equipmentId: string;

  @ApiProperty({ format: 'uuid' })
  employeeId: string;

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

  @ApiPropertyOptional({
    description: 'Notes at assignment / Observaciones de la asignación',
    type: String,
    nullable: true,
  })
  assignmentNotes: string | null;

  @ApiPropertyOptional({
    description: 'Notes at return / Observaciones de la devolución',
    type: String,
    nullable: true,
  })
  returnNotes: string | null;

  @ApiProperty({ type: () => EquipmentResponseDto })
  equipment: EquipmentResponseDto;
}

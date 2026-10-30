import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Trim } from '../../common/decorators/trim.decorator.js';

export class CreateAssignmentDto {
  @ApiProperty({ description: 'Equipment ID / ID del equipo', format: 'uuid' })
  @IsUUID()
  equipmentId: string;

  @ApiProperty({ description: 'Employee ID / ID del empleado', format: 'uuid' })
  @IsUUID()
  employeeId: string;

  @ApiPropertyOptional({
    description: 'Optional notes / Observaciones opcionales',
    example: 'Delivered with charger',
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

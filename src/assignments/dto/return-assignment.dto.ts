import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../common/decorators/trim.decorator.js';

export class ReturnAssignmentDto {
  @ApiPropertyOptional({
    description: 'Optional notes / Observaciones opcionales',
    example: 'Returned in good condition',
  })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

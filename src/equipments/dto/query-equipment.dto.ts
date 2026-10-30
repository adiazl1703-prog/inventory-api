import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';
import { EquipmentStatus, Location } from '../../generated/prisma/enums.js';

export class QueryEquipmentDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by location / Filtrar por ubicación',
    enum: Location,
  })
  @IsOptional()
  @IsEnum(Location)
  location?: Location;

  @ApiPropertyOptional({
    description: 'Filter by status / Filtrar por estado',
    enum: EquipmentStatus,
  })
  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;
}

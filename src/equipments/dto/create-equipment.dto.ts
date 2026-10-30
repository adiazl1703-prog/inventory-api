import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Trim } from '../../common/decorators/trim.decorator.js';
import { EquipmentStatus, Location } from '../../generated/prisma/enums.js';

// 'assigned' and 'decommissioned' are reached only through their workflows.
export const MANUAL_EQUIPMENT_STATUSES = [
  EquipmentStatus.available,
  EquipmentStatus.in_repair,
];

export class CreateEquipmentDto {
  @ApiProperty({
    description: 'Unique serial number / Número de serie único',
    example: 'SN-5CD1234XYZ',
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serialNumber: string;

  @ApiProperty({
    description: 'Equipment type / Tipo de equipo',
    example: 'Laptop',
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  type: string;

  @ApiProperty({ description: 'Brand / Marca', example: 'Lenovo' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  brand: string;

  @ApiProperty({ description: 'Model / Modelo', example: 'ThinkPad T14' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  model: string;

  @ApiProperty({
    description: 'Physical location / Ubicación física',
    enum: Location,
    example: Location.Bogota,
  })
  @IsEnum(Location)
  location: Location;

  @ApiPropertyOptional({
    description:
      "Initial status, defaults to 'available' / Estado inicial, por defecto 'available'",
    enum: MANUAL_EQUIPMENT_STATUSES,
    default: EquipmentStatus.available,
  })
  @IsOptional()
  @IsIn(MANUAL_EQUIPMENT_STATUSES)
  status?: EquipmentStatus;
}

import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/pagination.dto.js';
import { Location } from '../../generated/prisma/enums.js';

export class EmployeeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Full name / Nombre completo' })
  name: string;

  @ApiProperty({ description: 'ID document / Documento de identidad' })
  idDocument: string;

  @ApiProperty({ description: 'Role or position / Cargo' })
  position: string;

  @ApiProperty({
    description: 'Work location / Sede de trabajo',
    enum: Location,
  })
  location: Location;

  @ApiProperty({ description: 'Email address / Correo electrónico' })
  email: string;

  @ApiProperty({ description: 'Creation timestamp / Fecha y hora de creación' })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp / Fecha y hora de actualización',
  })
  updatedAt: Date;
}

export class PaginatedEmployeeDto {
  @ApiProperty({ type: () => [EmployeeResponseDto] })
  data: EmployeeResponseDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;
}

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { Trim } from '../../common/decorators/trim.decorator.js';
import { Location } from '../../generated/prisma/enums.js';

export class CreateEmployeeDto {
  @ApiProperty({
    description: 'Full name / Nombre completo',
    example: 'Ana Gómez',
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({
    description: 'Unique ID document / Documento de identidad único',
    example: '1020304050',
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  idDocument: string;

  @ApiProperty({
    description: 'Role or position / Cargo',
    example: 'Data Analyst',
  })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  position: string;

  @ApiProperty({
    description: 'Work location / Sede de trabajo',
    enum: Location,
    example: Location.Cartagena,
  })
  @IsEnum(Location)
  location: Location;

  @ApiProperty({
    description: 'Unique email address / Correo electrónico único',
    example: 'ana.gomez@example.com',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  email: string;
}

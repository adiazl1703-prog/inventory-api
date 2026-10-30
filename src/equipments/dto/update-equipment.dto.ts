import { PartialType } from '@nestjs/swagger';
import { CreateEquipmentDto } from './create-equipment.dto.js';

export class UpdateEquipmentDto extends PartialType(CreateEquipmentDto) {}

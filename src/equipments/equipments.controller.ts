import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateEquipmentDto } from './dto/create-equipment.dto.js';
import {
  EquipmentHistoryDto,
  EquipmentResponseDto,
  PaginatedEquipmentDto,
} from './dto/equipment-response.dto.js';
import { QueryEquipmentDto } from './dto/query-equipment.dto.js';
import { UpdateEquipmentDto } from './dto/update-equipment.dto.js';
import { EquipmentsService } from './equipments.service.js';

@ApiTags('Equipments / Equipos')
@Controller('equipments')
export class EquipmentsController {
  constructor(private readonly equipmentsService: EquipmentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Register equipment / Registrar equipo',
    description:
      "Status may only be 'available' or 'in_repair' at registration.\n\n" +
      "Al registrar, el estado solo puede ser 'available' o 'in_repair'.",
  })
  @ApiCreatedResponse({
    type: EquipmentResponseDto,
    description: 'Equipment registered / Equipo registrado',
  })
  @ApiBadRequestResponse({ description: 'Invalid data / Datos inválidos' })
  @ApiConflictResponse({
    description: 'Serial number already exists / El número de serie ya existe',
  })
  create(@Body() dto: CreateEquipmentDto) {
    return this.equipmentsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List equipment / Listar equipos',
    description:
      'Paginated list, optionally filtered by location and status.\n\n' +
      'Lista paginada, con filtro opcional por ubicación y estado.',
  })
  @ApiOkResponse({ type: PaginatedEquipmentDto })
  @ApiBadRequestResponse({ description: 'Invalid filter / Filtro inválido' })
  findAll(@Query() query: QueryEquipmentDto) {
    return this.equipmentsService.findAll(query);
  }

  @Get('serial/:serialNumber/assignments')
  @ApiOperation({
    summary:
      'Assignment history by serial number / Historial de asignaciones por número de serie',
    description:
      'Returns the equipment and every assignment it ever had, newest first.\n\n' +
      'Devuelve el equipo y todas sus asignaciones, de la más reciente a la más antigua.',
  })
  @ApiParam({
    name: 'serialNumber',
    description: 'Serial number / Número de serie',
  })
  @ApiOkResponse({ type: EquipmentHistoryDto })
  @ApiNotFoundResponse({
    description: 'Equipment not found / Equipo no encontrado',
  })
  findHistory(@Param('serialNumber') serialNumber: string) {
    return this.equipmentsService.findHistoryBySerial(serialNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get equipment by ID / Consultar equipo por ID' })
  @ApiOkResponse({ type: EquipmentResponseDto })
  @ApiNotFoundResponse({
    description: 'Equipment not found / Equipo no encontrado',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.equipmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update equipment / Actualizar equipo',
    description:
      "Status may only move between 'available' and 'in_repair'. Use the assignment and decommission endpoints for the other statuses.\n\n" +
      "El estado solo puede cambiar entre 'available' e 'in_repair'. Para los demás estados use los endpoints de asignación y de baja.",
  })
  @ApiOkResponse({ type: EquipmentResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid data / Datos inválidos' })
  @ApiNotFoundResponse({
    description: 'Equipment not found / Equipo no encontrado',
  })
  @ApiConflictResponse({
    description:
      'Decommissioned or assigned equipment, or duplicate serial number / Equipo dado de baja o asignado, o número de serie duplicado',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEquipmentDto,
  ) {
    return this.equipmentsService.update(id, dto);
  }

  @Patch(':id/decommission')
  @ApiOperation({
    summary: 'Decommission equipment / Dar de baja un equipo',
    description:
      'Keeps the record and its history. Assigned equipment must be returned first.\n\n' +
      'Conserva el registro y su historial. Un equipo asignado debe devolverse primero.',
  })
  @ApiOkResponse({ type: EquipmentResponseDto })
  @ApiNotFoundResponse({
    description: 'Equipment not found / Equipo no encontrado',
  })
  @ApiConflictResponse({
    description:
      'Equipment assigned or already decommissioned / Equipo asignado o ya dado de baja',
  })
  decommission(@Param('id', ParseUUIDPipe) id: string) {
    return this.equipmentsService.decommission(id);
  }
}

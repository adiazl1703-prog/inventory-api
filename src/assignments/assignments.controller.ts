import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AssignmentsService } from './assignments.service.js';
import { AssignmentResponseDto } from './dto/assignment-response.dto.js';
import { CreateAssignmentDto } from './dto/create-assignment.dto.js';
import { ReturnAssignmentDto } from './dto/return-assignment.dto.js';

@ApiTags('Assignments / Asignaciones')
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  @ApiOperation({
    summary:
      'Assign equipment to an employee / Asignar un equipo a un empleado',
    description:
      "The equipment must be 'available'. It becomes 'assigned' and the server records the exact timestamp.\n\n" +
      "El equipo debe estar 'available'. Pasa a 'assigned' y el servidor registra la fecha y hora exactas.",
  })
  @ApiCreatedResponse({
    type: AssignmentResponseDto,
    description: 'Assignment created / Asignación creada',
  })
  @ApiBadRequestResponse({ description: 'Invalid data / Datos inválidos' })
  @ApiNotFoundResponse({
    description:
      'Equipment or employee not found / Equipo o empleado no encontrado',
  })
  @ApiConflictResponse({
    description: 'Equipment not available / Equipo no disponible',
  })
  assign(@Body() dto: CreateAssignmentDto) {
    return this.assignmentsService.assign(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get assignment by ID / Consultar asignación por ID',
  })
  @ApiOkResponse({ type: AssignmentResponseDto })
  @ApiNotFoundResponse({
    description: 'Assignment not found / Asignación no encontrada',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.assignmentsService.findOne(id);
  }

  @Patch(':id/return')
  @ApiOperation({
    summary: 'Register equipment return / Registrar devolución de un equipo',
    description:
      "Closes the assignment with the exact timestamp and sets the equipment back to 'available'.\n\n" +
      "Cierra la asignación con la fecha y hora exactas y devuelve el equipo al estado 'available'.",
  })
  @ApiOkResponse({ type: AssignmentResponseDto })
  @ApiNotFoundResponse({
    description: 'Assignment not found / Asignación no encontrada',
  })
  @ApiConflictResponse({ description: 'Already returned / Ya fue devuelto' })
  registerReturn(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReturnAssignmentDto,
  ) {
    return this.assignmentsService.registerReturn(id, dto);
  }
}

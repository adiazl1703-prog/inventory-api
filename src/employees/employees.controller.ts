import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
  ApiTags,
} from '@nestjs/swagger';
import { AssignmentResponseDto } from '../assignments/dto/assignment-response.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import {
  EmployeeResponseDto,
  PaginatedEmployeeDto,
} from './dto/employee-response.dto.js';
import { EmployeesService } from './employees.service.js';

@ApiTags('Employees / Empleados')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @ApiOperation({ summary: 'Register employee / Registrar empleado' })
  @ApiCreatedResponse({
    type: EmployeeResponseDto,
    description: 'Employee registered / Empleado registrado',
  })
  @ApiBadRequestResponse({ description: 'Invalid data / Datos inválidos' })
  @ApiConflictResponse({
    description:
      'ID document or email already exists / El documento o el correo electrónico ya existe',
  })
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List employees / Listar empleados' })
  @ApiOkResponse({ type: PaginatedEmployeeDto })
  findAll(@Query() query: PaginationQueryDto) {
    return this.employeesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee by ID / Consultar empleado por ID' })
  @ApiOkResponse({ type: EmployeeResponseDto })
  @ApiNotFoundResponse({
    description: 'Employee not found / Empleado no encontrado',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.findOne(id);
  }

  @Get(':id/equipments')
  @ApiOperation({
    summary:
      'Current equipment of an employee / Equipos actuales de un empleado',
    description:
      'Lists the open assignments of the employee, including each assignment ID needed to register its return.\n\n' +
      'Lista las asignaciones abiertas del empleado, con el ID de asignación necesario para registrar la devolución.',
  })
  @ApiOkResponse({ type: [AssignmentResponseDto] })
  @ApiNotFoundResponse({
    description: 'Employee not found / Empleado no encontrado',
  })
  findCurrentEquipment(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.findCurrentEquipment(id);
  }
}

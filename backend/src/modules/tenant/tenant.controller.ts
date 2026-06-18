import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQuery } from '../../common/interfaces/pagination.interface';
import { Public } from '../../common/decorators/public.decorator';
@ApiTags('tenants') @Controller('tenants') @UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController {
  constructor(private svc: TenantService) {}
  @Post() @Roles('SUPER_ADMIN') @ApiBearerAuth() @ApiOperation({ summary: 'Create tenant' }) async create(@Body() dto: CreateTenantDto) { return this.svc.create(dto); }
  @Get() @Roles('SUPER_ADMIN') @ApiBearerAuth() @ApiOperation({ summary: 'List tenants' }) async findAll(@Query() q: PaginationQuery) { return this.svc.findAll(q); }
  @Public() @Get(':slug') @ApiOperation({ summary: 'Get by slug' }) async findBySlug(@Param('slug') slug: string) { return this.svc.findBySlug(slug); }
  @Put(':id') @Roles('SUPER_ADMIN') @ApiBearerAuth() @ApiOperation({ summary: 'Update' }) async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) { return this.svc.update(id, dto); }
  @Delete(':id') @Roles('SUPER_ADMIN') @ApiBearerAuth() @ApiOperation({ summary: 'Delete' }) async remove(@Param('id') id: string) { return this.svc.remove(id); }
}

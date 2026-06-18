import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MembershipService } from './membership.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { PaginationQuery } from '../../common/interfaces/pagination.interface';
@ApiTags('memberships') @Controller('memberships') @UseGuards(JwtAuthGuard, RolesGuard) @ApiBearerAuth()
export class MembershipController {
  constructor(private svc: MembershipService) {}
  @Post() @Roles('TENANT_ADMIN') @ApiOperation({ summary: 'Create membership' }) async create(@TenantId() tid: string, @Body() dto: any) { return this.svc.create(tid, dto); }
  @Get() @ApiOperation({ summary: 'List memberships' }) async findAll(@TenantId() tid: string, @Query() q: PaginationQuery) { return this.svc.findAll(tid, q); }
  @Get(':id') @ApiOperation({ summary: 'Get membership' }) async findOne(@Param('id') id: string, @TenantId() tid: string) { return this.svc.findOne(id, tid); }
  @Put(':id') @Roles('TENANT_ADMIN') async update(@Param('id') id: string, @Body() dto: any) { return this.svc.update(id, dto); }
  @Delete(':id') @Roles('TENANT_ADMIN') async remove(@Param('id') id: string) { return this.svc.remove(id); }
}

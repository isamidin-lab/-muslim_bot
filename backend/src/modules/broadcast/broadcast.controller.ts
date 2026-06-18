import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BroadcastService } from './broadcast.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { PaginationQuery } from '../../common/interfaces/pagination.interface';
@ApiTags('broadcasts') @Controller('broadcasts') @UseGuards(JwtAuthGuard, RolesGuard) @ApiBearerAuth()
export class BroadcastController {
  constructor(private svc: BroadcastService) {}
  @Post() @Roles('TENANT_ADMIN') async create(@TenantId() tid: string, @Body() dto: any) { return this.svc.create(tid, dto); }
  @Get() @Roles('TENANT_ADMIN') async findAll(@TenantId() tid: string, @Query() q: PaginationQuery) { return this.svc.findAll(tid, q); }
  @Get(':id') @Roles('TENANT_ADMIN') async findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post(':id/send') @Roles('TENANT_ADMIN') async send(@Param('id') id: string) { return this.svc.send(id); }
  @Delete(':id') @Roles('TENANT_ADMIN') async remove(@Param('id') id: string) { return this.svc.remove(id); }
}

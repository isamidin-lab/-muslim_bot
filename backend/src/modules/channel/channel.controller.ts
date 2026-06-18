import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChannelService } from './channel.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
@ApiTags('channels') @Controller('channels') @UseGuards(JwtAuthGuard, RolesGuard) @ApiBearerAuth()
export class ChannelController {
  constructor(private svc: ChannelService) {}
  @Post() @Roles('TENANT_ADMIN') @ApiOperation({ summary: 'Add channel' }) async create(@TenantId() tid: string, @Body() dto: any) { return this.svc.create(tid, dto); }
  @Get() @ApiOperation({ summary: 'List channels' }) async findAll(@TenantId() tid: string) { return this.svc.findAll(tid); }
  @Get(':id') @ApiOperation({ summary: 'Get channel' }) async findOne(@Param('id') id: string, @TenantId() tid: string) { return this.svc.findOne(id, tid); }
  @Delete(':id') @Roles('TENANT_ADMIN') async remove(@Param('id') id: string) { return this.svc.remove(id); }
}

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { PaginationQuery } from '../../common/interfaces/pagination.interface';
@ApiTags('crm') @Controller('users') @UseGuards(JwtAuthGuard, RolesGuard) @Roles('TENANT_ADMIN') @ApiBearerAuth()
export class UserController {
  constructor(private svc: UserService) {}
  @Get() @ApiOperation({ summary: 'List users' }) async findAll(@TenantId() tid: string, @Query() q: PaginationQuery & { search?: string }) { return this.svc.findAll(tid, q); }
  @Get('stats') async stats(@TenantId() tid: string) { return this.svc.getUserStats(tid); }
  @Get(':id') async findOne(@Param('id') id: string, @TenantId() tid: string) { return this.svc.findOne(id, tid); }
}

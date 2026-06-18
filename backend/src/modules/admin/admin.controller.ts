import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
@ApiTags('admin') @Controller('admin') @UseGuards(JwtAuthGuard, RolesGuard) @Roles('SUPER_ADMIN') @ApiBearerAuth()
export class AdminController {
  constructor(private svc: AdminService) {}
  @Get('stats') @ApiOperation({ summary: 'System stats' }) async stats() { return this.svc.getSystemStats(); }
}

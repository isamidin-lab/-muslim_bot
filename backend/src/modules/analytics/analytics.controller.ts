import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
@ApiTags('analytics') @Controller('analytics') @UseGuards(JwtAuthGuard, RolesGuard) @Roles('TENANT_ADMIN') @ApiBearerAuth()
export class AnalyticsController {
  constructor(private svc: AnalyticsService) {}
  @Get('dashboard') async dashboard(@TenantId() tid: string, @Query('days') days?: number) { return this.svc.getDashboard(tid, days || 30); }
  @Get('courses') async courses(@TenantId() tid: string) { return this.svc.getCourseAnalytics(tid); }
}

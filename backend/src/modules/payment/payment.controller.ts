import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PaginationQuery } from '../../common/interfaces/pagination.interface';
@ApiTags('payments') @Controller('payments')
export class PaymentController {
  constructor(private svc: PaymentService) {}
  @Post('purchase') @UseGuards(JwtAuthGuard) @ApiBearerAuth() async purchase(@CurrentUser('id') uid: string, @Body() dto: { membershipId: string; provider: string; promocode?: string }) { return this.svc.createPurchase(uid, dto.membershipId, dto.provider, dto.promocode); }
  @Post('confirm') @Public() @HttpCode(HttpStatus.OK) async confirm(@Body() dto: { purchaseId: string; orderId: string }) { return this.svc.processPayment(dto.purchaseId, dto.orderId); }
  @Get() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('TENANT_ADMIN') @ApiBearerAuth() async findAll(@TenantId() tid: string, @Query() q: PaginationQuery & { status?: string }) { return this.svc.findAll(tid, q); }
  @Get('revenue') @UseGuards(JwtAuthGuard, RolesGuard) @Roles('TENANT_ADMIN') @ApiBearerAuth() async revenue(@TenantId() tid: string, @Query('days') days?: number) { return this.svc.getRevenueStats(tid, days || 30); }
}

import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
@ApiTags('ai') @Controller('ai') @UseGuards(JwtAuthGuard) @ApiBearerAuth()
export class AiController {
  constructor(private svc: AiService) {}
  @Post('chat') async chat(@CurrentUser('id') uid: string, @TenantId() tid: string, @Body() dto: { messages: { role: string; content: string }[] }) { return this.svc.chat(uid, tid, dto.messages); }
  @Post('quiz') async quiz(@TenantId() tid: string, @Body() dto: { topic: string; difficulty: string; count?: number }) { return this.svc.generateQuiz(tid, dto.topic, dto.difficulty, dto.count); }
  @Post('translate') async translate(@TenantId() tid: string, @Body() dto: { text: string }) { return this.svc.translateToArabic(dto.text, tid); }
  @Get('usage') async usage(@TenantId() tid: string) { return this.svc.getUsageStats(tid); }
}

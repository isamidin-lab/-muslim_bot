import { Controller, Post, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { Public } from '../../common/decorators/public.decorator';
@ApiTags('telegram') @Controller('telegram')
export class TelegramController {
  constructor(private svc: TelegramService) {}
  @Post('webhook') @Public() @HttpCode(HttpStatus.OK) @ApiOperation({ summary: 'Webhook' }) async webhook(@Req() req: any) { await this.svc.handleWebhook(req.body); return { ok: true }; }
}

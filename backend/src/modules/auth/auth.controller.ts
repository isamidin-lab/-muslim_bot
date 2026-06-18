import { Controller, Post, Put, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  @Public() @Post('register') @ApiOperation({ summary: 'Register' }) async register(@Body() dto: RegisterDto) { return this.authService.register(dto); }
  @Public() @Post('login') @HttpCode(HttpStatus.OK) @ApiOperation({ summary: 'Login' }) async login(@Body() dto: LoginDto) { return this.authService.login(dto); }
  @Public() @Post('login/telegram') @HttpCode(HttpStatus.OK) @ApiOperation({ summary: 'Telegram login' }) async loginTelegram(@Body() body: { telegramId: string; tenantId: string }) { return this.authService.loginByTelegram(body.telegramId, body.tenantId); }
  @Public() @Post('refresh') @HttpCode(HttpStatus.OK) @ApiOperation({ summary: 'Refresh token' }) async refresh(@Body() dto: RefreshTokenDto) { return { message: 'Refresh token flow' }; }
  @Get('profile') @UseGuards(JwtAuthGuard) @ApiBearerAuth() @ApiOperation({ summary: 'Get profile' }) async profile(@CurrentUser('id') id: string) { return this.authService.getProfile(id); }
  @Put('profile') @UseGuards(JwtAuthGuard) @ApiBearerAuth() @ApiOperation({ summary: 'Update profile' }) async updateProfile(@CurrentUser('id') id: string, @Body() dto: { firstName?: string; lastName?: string; email?: string; password?: string }) { return this.authService.updateProfile(id, dto); }
}

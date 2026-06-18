import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector, private jwtService: JwtService, private config: ConfigService, private prisma: PrismaService) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()])) return true;
    const req = ctx.switchToHttp().getRequest();
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) throw new UnauthorizedException('Missing token');
    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: this.config.get<string>('JWT_SECRET') });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, include: { tenant: true } });
      if (!user || !user.isActive) throw new UnauthorizedException('User not found');
      req.user = user;
      req.tenantId = user.tenantId;
    } catch { throw new UnauthorizedException('Invalid token'); }
    return true;
  }
}

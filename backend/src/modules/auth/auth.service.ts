import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(private prisma: PrismaService, private jwtService: JwtService, private config: ConfigService) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({ where: { OR: [{ email: dto.email }, { telegramId: dto.telegramId }].filter(Boolean) } });
    if (existing) throw new ConflictException('User already exists');
    const pw = dto.password ? await bcrypt.hash(dto.password, 12) : null;
    const user = await this.prisma.user.create({ data: { firstName: dto.firstName, lastName: dto.lastName, email: dto.email, telegramId: dto.telegramId, passwordHash: pw, tenantId: dto.tenantId, role: 'MEMBER' }, include: { tenant: true } });
    const tokens = await this.generateTokens(user);
    return { user: this.sanitize(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({ where: { OR: [{ email: dto.email }, { telegramId: dto.telegramId }].filter(Boolean) }, include: { tenant: true } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account disabled');
    if (dto.password && user.passwordHash) {
      if (!(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return { user: this.sanitize(user), ...(await this.generateTokens(user)) };
  }

  async loginByTelegram(telegramId: string, tenantId: string) {
    let user = await this.prisma.user.findFirst({ where: { telegramId, tenantId }, include: { tenant: true } });
    if (!user) {
      user = await this.prisma.user.create({ data: { telegramId, firstName: 'Telegram User', tenantId, role: 'MEMBER' }, include: { tenant: true } });
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return { user: this.sanitize(user), ...(await this.generateTokens(user)) };
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId }, include: { tenant: true, userMemberships: { where: { status: 'ACTIVE' }, include: { membership: true } } } });
  }

  async updateProfile(userId: string, dto: { firstName?: string; lastName?: string; email?: string; password?: string }) {
    const data: any = {};
    if (dto.firstName) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.email) data.email = dto.email;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.update({ where: { id: userId }, data, include: { tenant: true } });
    return { user: this.sanitize(user) };
  }

  private async generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '30d') }),
    ]);
    return { accessToken, refreshToken };
  }
  private sanitize(user: any) { if (!user) return null; const { passwordHash, ...rest } = user; return rest; }
}

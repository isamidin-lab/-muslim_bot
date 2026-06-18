import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import * as bcrypt from 'bcryptjs';
@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);
  constructor(private prisma: PrismaService, private config: ConfigService) {}
  async onModuleInit() { await this.ensureAdmin(); }
  private async ensureAdmin() {
    const email = this.config.get('ADMIN_DEFAULT_EMAIL', 'admin@muslim-bot.com');
    const password = this.config.get('ADMIN_DEFAULT_PASSWORD', 'admin123');
    if (await this.prisma.user.findFirst({ where: { email } })) return;
    let tenant = await this.prisma.tenant.findFirst({ where: { slug: 'system' } });
    if (!tenant) tenant = await this.prisma.tenant.create({ data: { name: 'System', slug: 'system' } });
    const pw = await bcrypt.hash(password, 12);
    await this.prisma.user.create({ data: { email, firstName: 'System', lastName: 'Admin', passwordHash: pw, role: 'SUPER_ADMIN', tenantId: tenant.id } });
    this.logger.log('Default admin created');
  }
  async getSystemStats() {
    const [tenants, users, courses, purchases] = await Promise.all([this.prisma.tenant.count(), this.prisma.user.count(), this.prisma.course.count(), this.prisma.purchase.count({ where: { status: 'COMPLETED' } })]);
    const revenue = await this.prisma.purchase.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } });
    return { tenants, users, courses, purchases, totalRevenue: revenue._sum.amount || 0 };
  }
}

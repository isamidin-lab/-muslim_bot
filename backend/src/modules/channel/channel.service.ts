import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
@Injectable()
export class ChannelService {
  constructor(private prisma: PrismaService) {}
  async create(tenantId: string, data: any) { return this.prisma.channel.create({ data: { tenantId, telegramId: data.telegramId, title: data.title, username: data.username } }); }
  async findAll(tenantId: string) { return this.prisma.channel.findMany({ where: { tenantId }, include: { _count: { select: { memberships: true } } }, orderBy: { createdAt: 'desc' } }); }
  async findOne(id: string, tenantId: string) { const c = await this.prisma.channel.findFirst({ where: { id, tenantId } }); if (!c) throw new NotFoundException(); return c; }
  async remove(id: string) { return this.prisma.channel.delete({ where: { id } }); }
}

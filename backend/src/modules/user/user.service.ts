import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PaginationQuery, PageDto, PageMetaDto } from '../../common/interfaces/pagination.interface';
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async findAll(tenantId: string, q: PaginationQuery & { search?: string }) {
    const where: any = { tenantId };
    if (q.search) where.OR = [{ firstName: { contains: q.search } }, { lastName: { contains: q.search } }, { email: { contains: q.search } }];
    const [data, total] = await Promise.all([this.prisma.user.findMany({ where, include: { userMemberships: { include: { membership: true } }, _count: { select: { purchases: true } } }, skip: q.skip, take: q.take, orderBy: { createdAt: 'desc' } }), this.prisma.user.count({ where })]);
    return new PageDto(data, new PageMetaDto(q.page || 1, q.limit || 10, total));
  }
  async findOne(id: string, tenantId: string) { const u = await this.prisma.user.findFirst({ where: { id, tenantId }, include: { userMemberships: { include: { membership: true } }, purchases: { orderBy: { createdAt: 'desc' }, take: 10 } } }); if (!u) throw new NotFoundException(); return u; }
  async getUserStats(tenantId: string) {
    const total = await this.prisma.user.count({ where: { tenantId } });
    const active = await this.prisma.user.count({ where: { tenantId, lastLoginAt: { gte: new Date(Date.now() - 30 * 86400000) } } });
    return { total, active };
  }
}

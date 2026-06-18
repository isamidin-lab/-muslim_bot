import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PaginationQuery, PageDto, PageMetaDto } from '../../common/interfaces/pagination.interface';
@Injectable()
export class MembershipService {
  constructor(private prisma: PrismaService) {}
  async create(tenantId: string, data: any) {
    return this.prisma.membership.create({ data: { tenantId, name: data.name, description: data.description, price: data.price, currency: data.currency || 'USD', interval: data.interval || 'MONTHLY', features: JSON.stringify(data.features || []), courseIds: JSON.stringify(data.courseIds || []) } });
  }
  async findAll(tenantId: string, q: PaginationQuery) {
    const [data, total] = await Promise.all([this.prisma.membership.findMany({ where: { tenantId, isActive: true }, include: { _count: { select: { purchases: true } } }, skip: q.skip, take: q.take, orderBy: { sortOrder: 'asc' } }), this.prisma.membership.count({ where: { tenantId, isActive: true } })]);
    return new PageDto(data, new PageMetaDto(q.page || 1, q.limit || 10, total));
  }
  async findOne(id: string, tenantId: string) { const m = await this.prisma.membership.findFirst({ where: { id, tenantId } }); if (!m) throw new NotFoundException(); return m; }
  async update(id: string, data: any) { return this.prisma.membership.update({ where: { id }, data }); }
  async remove(id: string) { return this.prisma.membership.delete({ where: { id } }); }
  async activateMembership(userId: string, membershipId: string, purchaseId?: string) {
    const m = await this.prisma.membership.findUnique({ where: { id: membershipId } });
    if (!m) throw new NotFoundException('Membership not found');
    const now = new Date(); let endDate: Date | null = null;
    if (m.interval === 'MONTHLY') endDate = new Date(now.getTime() + 30 * 86400000);
    else if (m.interval === 'QUARTERLY') endDate = new Date(now.getTime() + 90 * 86400000);
    else if (m.interval === 'YEARLY') endDate = new Date(now.getTime() + 365 * 86400000);
    return this.prisma.userMembership.create({ data: { userId, membershipId, status: 'ACTIVE', startDate: now, endDate, autoRenew: m.autoRenew } });
  }
}

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { PaginationQuery, PageDto, PageMetaDto } from '../../common/interfaces/pagination.interface';
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  constructor(private prisma: PrismaService, private membershipService: MembershipService) {}

  async createPurchase(userId: string, membershipId: string, provider: string, promocode?: string) {
    const membership = await this.prisma.membership.findUnique({ where: { id: membershipId } });
    if (!membership) throw new NotFoundException('Membership not found');
    let discount = 0; let promocodeId: string | undefined;
    if (promocode) {
      const promo = await this.prisma.promocode.findUnique({ where: { code: promocode }, include: { promotion: true } });
      if (promo?.isActive && promo.promotion.isActive) {
        discount = promo.promotion.isPercent ? membership.price * (promo.promotion.discount / 100) : promo.promotion.discount;
        promocodeId = promo.id;
        await this.prisma.promotion.update({ where: { id: promo.promotionId }, data: { usedCount: { increment: 1 } } });
      }
    }
    const amount = Math.max(0, membership.price - discount);
    return this.prisma.purchase.create({ data: { userId, membershipId, amount, currency: membership.currency, provider, status: 'PENDING', promocodeId, metadata: JSON.stringify({ discount, originalPrice: membership.price }) } });
  }

  async processPayment(purchaseId: string, orderId: string) {
    const p = await this.prisma.purchase.findUnique({ where: { id: purchaseId } });
    if (!p) throw new NotFoundException('Purchase not found');
    const updated = await this.prisma.purchase.update({ where: { id: purchaseId }, data: { status: 'COMPLETED', providerOrderId: orderId, paidAt: new Date() } });
    await this.membershipService.activateMembership(p.userId, p.membershipId, purchaseId);
    return updated;
  }

  async findAll(tenantId: string, q: PaginationQuery & { status?: string }) {
    const where: any = { user: { tenantId } };
    if (q.status) where.status = q.status;
    const [data, total] = await Promise.all([this.prisma.purchase.findMany({ where, include: { user: { select: { firstName: true, lastName: true } }, membership: { select: { name: true } } }, skip: q.skip, take: q.take, orderBy: { createdAt: 'desc' } }), this.prisma.purchase.count({ where })]);
    return new PageDto(data, new PageMetaDto(q.page || 1, q.limit || 10, total));
  }

  async getRevenueStats(tenantId: string, days = 30) {
    const since = new Date(Date.now() - days * 86400000);
    const [totalRevenue, totalSales] = await Promise.all([
      this.prisma.purchase.aggregate({ where: { user: { tenantId }, status: 'COMPLETED', createdAt: { gte: since } }, _sum: { amount: true } }),
      this.prisma.purchase.count({ where: { user: { tenantId }, status: 'COMPLETED', createdAt: { gte: since } } }),
    ]);
    return { totalRevenue: totalRevenue._sum.amount || 0, totalSales, averageOrderValue: totalSales > 0 ? (totalRevenue._sum.amount || 0) / totalSales : 0 };
  }
}

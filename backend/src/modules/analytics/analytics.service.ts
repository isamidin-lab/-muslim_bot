import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}
  async getDashboard(tenantId: string, days = 30) {
    const since = new Date(Date.now() - days * 86400000);
    const [revenue, sales, totalUsers, newUsers, activeUsers] = await Promise.all([
      this.prisma.purchase.aggregate({ where: { user: { tenantId }, status: 'COMPLETED', createdAt: { gte: since } }, _sum: { amount: true } }),
      this.prisma.purchase.count({ where: { user: { tenantId }, status: 'COMPLETED', createdAt: { gte: since } } }),
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.user.count({ where: { tenantId, createdAt: { gte: since } } }),
      this.prisma.user.count({ where: { tenantId, lastLoginAt: { gte: since } } }),
    ]);
    return { totalRevenue: revenue._sum.amount || 0, totalSales: sales, totalUsers, newUsers, activeUsers, conversionRate: totalUsers > 0 ? ((sales / totalUsers) * 100).toFixed(1) : '0' };
  }
  async getCourseAnalytics(tenantId: string) { return this.prisma.course.findMany({ where: { tenantId }, include: { _count: { select: { progresses: true } } } }); }
}

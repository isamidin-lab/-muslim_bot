import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from '../payment.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { MembershipService } from '../../membership/membership.service';
import { NotFoundException } from '@nestjs/common';

describe('PaymentService', () => {
  let service: PaymentService;
  let prisma: any;
  let membershipService: any;

  beforeEach(async () => {
    prisma = {
      purchase: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn(), count: jest.fn(), aggregate: jest.fn() },
      membership: { findUnique: jest.fn() },
      promocode: { findUnique: jest.fn() },
      promotion: { update: jest.fn() },
    };
    membershipService = { activateMembership: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: prisma },
        { provide: MembershipService, useValue: membershipService },
      ],
    }).compile();
    service = module.get(PaymentService);
  });

  describe('createPurchase', () => {
    it('should create a purchase without promocode', async () => {
      prisma.membership.findUnique.mockResolvedValue({ id: 'm1', price: 9.99, currency: 'USD' });
      prisma.purchase.create.mockResolvedValue({ id: 'p1', amount: 9.99, status: 'PENDING' });
      const result = await service.createPurchase('u1', 'm1', 'telegram_stars');
      expect(result.amount).toBe(9.99);
      expect(result.status).toBe('PENDING');
    });

    it('should apply promocode discount', async () => {
      prisma.membership.findUnique.mockResolvedValue({ id: 'm1', price: 10, currency: 'USD' });
      prisma.promocode.findUnique.mockResolvedValue({
        id: 'pc1', code: 'LAUNCH20', isActive: true,
        promotion: { id: 'promo1', isActive: true, discount: 20, isPercent: true },
      });
      prisma.purchase.create.mockResolvedValue({ id: 'p1', amount: 8 });
      const result = await service.createPurchase('u1', 'm1', 'telegram_stars', 'LAUNCH20');
      expect(result.amount).toBe(8);
    });

    it('should throw if membership not found', async () => {
      prisma.membership.findUnique.mockResolvedValue(null);
      await expect(service.createPurchase('u1', 'invalid', 'telegram_stars')).rejects.toThrow(NotFoundException);
    });
  });

  describe('processPayment', () => {
    it('should complete purchase and activate membership', async () => {
      prisma.purchase.findUnique.mockResolvedValue({ id: 'p1', userId: 'u1', membershipId: 'm1', status: 'PENDING' });
      prisma.purchase.update.mockResolvedValue({ status: 'COMPLETED' });
      membershipService.activateMembership.mockResolvedValue({});
      const result = await service.processPayment('p1', 'charge123');
      expect(result.status).toBe('COMPLETED');
      expect(membershipService.activateMembership).toHaveBeenCalledWith('u1', 'm1', 'p1');
    });
  });

  describe('getRevenueStats', () => {
    it('should return revenue stats', async () => {
      prisma.purchase.aggregate.mockResolvedValue({ _sum: { amount: 100 } });
      prisma.purchase.count.mockResolvedValue(10);
      const result = await service.getRevenueStats('tenant1');
      expect(result.totalRevenue).toBe(100);
      expect(result.totalSales).toBe(10);
    });
  });
});

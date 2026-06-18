import { Test, TestingModule } from '@nestjs/testing';
import { MembershipService } from '../membership.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('MembershipService', () => {
  let service: MembershipService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      membership: {
        findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(),
        update: jest.fn(), delete: jest.fn(), count: jest.fn(),
      },
      userMembership: { create: jest.fn() },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [MembershipService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(MembershipService);
  });

  describe('findAll', () => {
    it('should return paginated memberships', async () => {
      prisma.membership.findMany.mockResolvedValue([
        { id: 'm1', name: 'Basic', price: 9.99, interval: 'MONTHLY' },
        { id: 'm2', name: 'Premium', price: 29.99, interval: 'MONTHLY' },
      ]);
      prisma.membership.count.mockResolvedValue(2);
      const result = await service.findAll('tenant1', { page: 1, limit: 10, skip: 0, take: 10 });
      expect(result.data).toHaveLength(2);
    });
  });

  describe('create', () => {
    it('should create a membership', async () => {
      prisma.membership.create.mockResolvedValue({ id: 'm1', name: 'Basic', price: 9.99 });
      const result = await service.create('tenant1', { name: 'Basic', price: 9.99, interval: 'MONTHLY' });
      expect(result.name).toBe('Basic');
    });
  });

  describe('activateMembership', () => {
    it('should activate membership', async () => {
      prisma.membership.findUnique.mockResolvedValue({ id: 'm1', interval: 'MONTHLY', autoRenew: false });
      prisma.userMembership.create.mockResolvedValue({});
      await service.activateMembership('user1', 'm1');
      expect(prisma.userMembership.create).toHaveBeenCalled();
    });

    it('should throw if not found', async () => {
      prisma.membership.findUnique.mockResolvedValue(null);
      await expect(service.activateMembership('user1', 'invalid')).rejects.toThrow(NotFoundException);
    });
  });
});

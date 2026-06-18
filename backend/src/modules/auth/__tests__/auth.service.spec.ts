import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01'),
  compare: jest.fn().mockImplementation((pw: string, hash: string) => Promise.resolve(true)),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;

  beforeEach(async () => {
    prisma = { user: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() } };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('jwt-token') } },
        { provide: ConfigService, useValue: { get: jest.fn((k: string, d?: any) => d) } },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  describe('register', () => {
    it('should create a new user and return tokens', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u1', firstName: 'Test', email: 'test@test.com', role: 'MEMBER', tenantId: 't1', isActive: true,
      });
      const result = await service.register({ firstName: 'Test', email: 'test@test.com', password: 'pass123', tenantId: 't1' });
      expect(result.accessToken).toBe('jwt-token');
      expect(result.user.firstName).toBe('Test');
    });

    it('should throw ConflictException if user exists', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'existing' });
      await expect(service.register({ firstName: 'Test', email: 'test@test.com', password: 'pass', tenantId: 't1' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'u1', email: 'test@test.com', passwordHash: '$2a$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01',
        firstName: 'Test', role: 'MEMBER', tenantId: 't1', isActive: true,
      });
      prisma.user.update.mockResolvedValue({});
      const result = await service.login({ email: 'test@test.com', password: 'pass123' });
      expect(result.accessToken).toBe('jwt-token');
    });

    it('should throw for invalid credentials', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.login({ email: 'wrong@test.com', password: 'pass' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});

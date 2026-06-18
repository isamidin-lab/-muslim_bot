import { Test, TestingModule } from '@nestjs/testing';
import { CourseService } from '../course.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CourseService', () => {
  let service: CourseService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      course: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
      courseModule: { create: jest.fn() },
      lesson: { create: jest.fn() },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [CourseService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(CourseService);
  });

  describe('findAll', () => {
    it('should return paginated courses', async () => {
      prisma.course.findMany.mockResolvedValue([{ id: 'c1', title: 'Course 1' }]);
      prisma.course.count.mockResolvedValue(1);
      const result = await service.findAll('tenant1', { page: 1, limit: 10, skip: 0, take: 10 });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a course by id', async () => {
      prisma.course.findFirst.mockResolvedValue({ id: 'c1', title: 'Course 1', modules: [] });
      const result = await service.findOne('c1', 'tenant1');
      expect(result.id).toBe('c1');
    });

    it('should throw NotFoundException', async () => {
      prisma.course.findFirst.mockResolvedValue(null);
      await expect(service.findOne('invalid', 'tenant1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a course', async () => {
      prisma.course.findFirst.mockResolvedValue(null);
      prisma.course.create.mockResolvedValue({ id: 'c1', title: 'New', slug: 'new' });
      const result = await service.create('tenant1', { title: 'New', slug: 'new' });
      expect(result.title).toBe('New');
    });
  });

  describe('remove', () => {
    it('should delete a course', async () => {
      prisma.course.findFirst.mockResolvedValue({ id: 'c1', tenantId: 'tenant1' });
      prisma.course.delete.mockResolvedValue({});
      await service.remove('c1', 'tenant1');
      expect(prisma.course.delete).toHaveBeenCalled();
    });

    it('should throw if not found', async () => {
      prisma.course.findFirst.mockResolvedValue(null);
      await expect(service.remove('invalid', 'tenant1')).rejects.toThrow(NotFoundException);
    });
  });
});

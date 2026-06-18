import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PaginationQuery, PageDto, PageMetaDto } from '../../common/interfaces/pagination.interface';
@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}
  async create(tenantId: string, dto: any) {
    const slug = dto.title.toLowerCase().replace(/\s+/g, '-');
    return this.prisma.course.create({ data: { tenantId, title: dto.title, slug, description: dto.description, isPublished: dto.isPublished, settings: JSON.stringify(dto.settings || {}) } });
  }
  async findAll(tenantId: string, q: PaginationQuery) {
    const [data, total] = await Promise.all([this.prisma.course.findMany({ where: { tenantId }, include: { _count: { select: { modules: true, progresses: true } } }, skip: q.skip, take: q.take, orderBy: { sortOrder: 'asc' } }), this.prisma.course.count({ where: { tenantId } })]);
    return new PageDto(data, new PageMetaDto(q.page || 1, q.limit || 10, total));
  }
  async findOne(id: string, tenantId: string) {
    const c = await this.prisma.course.findFirst({ where: { id, tenantId }, include: { modules: { include: { lessons: { include: { tests: true, homeworks: true } } }, orderBy: { sortOrder: 'asc' } }, _count: { select: { progresses: true } } } });
    if (!c) throw new NotFoundException(); return c;
  }
  async update(id: string, tenantId: string, dto: any) { await this.findOne(id, tenantId); return this.prisma.course.update({ where: { id }, data: dto }); }
  async remove(id: string, tenantId: string) { await this.findOne(id, tenantId); return this.prisma.course.delete({ where: { id } }); }
  async addModule(courseId: string, dto: any) { return this.prisma.courseModule.create({ data: { courseId, title: dto.title, sortOrder: dto.sortOrder || 0 } }); }
  async addLesson(moduleId: string, dto: any) { return this.prisma.lesson.create({ data: { moduleId, title: dto.title, content: dto.content, contentType: dto.contentType || 'TEXT', isFree: dto.isFree, isPublished: dto.isPublished } }); }
}

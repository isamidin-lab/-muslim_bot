import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PaginationQuery, PageDto, PageMetaDto } from '../../common/interfaces/pagination.interface';
@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}
  async create(data: any) {
    const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    if (await this.prisma.tenant.findUnique({ where: { slug } })) throw new ConflictException('Slug exists');
    return this.prisma.tenant.create({ data: { name: data.name, slug, description: data.description, settings: JSON.stringify(data.settings || {}) } });
  }
  async findAll(q: PaginationQuery) {
    const [data, total] = await Promise.all([this.prisma.tenant.findMany({ where: { isActive: true }, skip: q.skip, take: q.take, orderBy: { createdAt: 'desc' } }), this.prisma.tenant.count({ where: { isActive: true } })]);
    return new PageDto(data, new PageMetaDto(q.page || 1, q.limit || 10, total));
  }
  async findBySlug(slug: string) { const t = await this.prisma.tenant.findUnique({ where: { slug }, include: { _count: { select: { users: true, courses: true, channels: true } } } }); if (!t) throw new NotFoundException(); return t; }
  async findOne(id: string) { const t = await this.prisma.tenant.findUnique({ where: { id } }); if (!t) throw new NotFoundException(); return t; }
  async update(id: string, data: any) { await this.findOne(id); return this.prisma.tenant.update({ where: { id }, data }); }
  async remove(id: string) { await this.findOne(id); return this.prisma.tenant.delete({ where: { id } }); }
}

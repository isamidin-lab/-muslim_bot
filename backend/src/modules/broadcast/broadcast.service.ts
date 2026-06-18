import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { QueueService } from '../../shared/queue/queue.service';
import { PaginationQuery, PageDto, PageMetaDto } from '../../common/interfaces/pagination.interface';
@Injectable()
export class BroadcastService {
  constructor(private prisma: PrismaService, private queue: QueueService) {}
  async create(tenantId: string, data: any) { return this.prisma.broadcast.create({ data: { tenantId, title: data.title, content: data.content, type: data.type || 'INSTANT', targetTags: JSON.stringify(data.targetTags || []) } }); }
  async findAll(tenantId: string, q: PaginationQuery) {
    const [data, total] = await Promise.all([this.prisma.broadcast.findMany({ where: { tenantId }, skip: q.skip, take: q.take, orderBy: { createdAt: 'desc' } }), this.prisma.broadcast.count({ where: { tenantId } })]);
    return new PageDto(data, new PageMetaDto(q.page || 1, q.limit || 10, total));
  }
  async findOne(id: string) { const b = await this.prisma.broadcast.findUnique({ where: { id }, include: { funnelSteps: true } }); if (!b) throw new NotFoundException(); return b; }
  async send(id: string) { await this.prisma.broadcast.update({ where: { id }, data: { status: 'SENDING' } }); await this.queue.addBroadcastJob({ broadcastId: id }); return { message: 'Queued' }; }
  async remove(id: string) { return this.prisma.broadcast.delete({ where: { id } }); }
}

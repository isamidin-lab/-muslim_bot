import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  constructor(private prisma: PrismaService) {}
  async log(entry: any) { try { await this.prisma.auditLog.create({ data: entry }); } catch (e) { this.logger.error('Audit log failed', e); } }
}

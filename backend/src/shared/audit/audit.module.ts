import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
@Global()
@Module({ providers: [AuditService, PrismaService], exports: [AuditService] })
export class AuditModule {}

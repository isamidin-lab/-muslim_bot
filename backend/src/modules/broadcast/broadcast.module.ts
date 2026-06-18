import { Module } from '@nestjs/common';
import { BroadcastService } from './broadcast.service';
import { BroadcastController } from './broadcast.controller';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { QueueService } from '../../shared/queue/queue.service';
@Module({ controllers: [BroadcastController], providers: [BroadcastService, PrismaService, QueueService] })
export class BroadcastModule {}

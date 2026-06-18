import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { PaymentModule } from '../payment/payment.module';
import { MembershipModule } from '../membership/membership.module';
@Module({ imports: [PaymentModule, MembershipModule], controllers: [TelegramController], providers: [TelegramService, PrismaService], exports: [TelegramService] })
export class TelegramModule {}

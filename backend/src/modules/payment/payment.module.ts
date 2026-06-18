import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { MembershipModule } from '../membership/membership.module';
@Module({ imports: [MembershipModule], controllers: [PaymentController], providers: [PaymentService, PrismaService], exports: [PaymentService] })
export class PaymentModule {}

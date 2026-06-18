import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { GlobalJwtModule } from './shared/global-jwt.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { UserModule } from './modules/user/user.module';
import { CourseModule } from './modules/course/course.module';
import { MembershipModule } from './modules/membership/membership.module';
import { ChannelModule } from './modules/channel/channel.module';
import { BroadcastModule } from './modules/broadcast/broadcast.module';
import { PaymentModule } from './modules/payment/payment.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiModule } from './modules/ai/ai.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { RedisModule } from './shared/redis/redis.module';
import { S3Module } from './shared/s3/s3.module';
import { QueueModule } from './shared/queue/queue.module';
import { AuditModule } from './shared/audit/audit.module';
import { EventBusModule } from './shared/event-bus/event-bus.module';
import { PrismaService } from './infrastructure/database/prisma.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRootAsync({ imports: [ConfigModule], inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ throttlers: [{ ttl: config.get('THROTTLE_TTL', 60000), limit: config.get('THROTTLE_LIMIT', 100) }] }),
    }),
    ScheduleModule.forRoot(), GlobalJwtModule, EventEmitterModule.forRoot(),
    RedisModule, S3Module, QueueModule, AuditModule, EventBusModule,
    AuthModule, TenantModule, UserModule, CourseModule, MembershipModule,
    ChannelModule, BroadcastModule, PaymentModule, AnalyticsModule,
    AiModule, TelegramModule, AdminModule, HealthModule,
  ],
  providers: [PrismaService, JwtAuthGuard, RolesGuard],
  exports: [PrismaService, JwtAuthGuard, RolesGuard],
})
export class AppModule {}

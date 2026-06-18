import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { PrismaService } from '../../infrastructure/database/prisma.service';
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController], providers: [AuthService, JwtStrategy, GoogleStrategy, PrismaService], exports: [AuthService],
})
export class AuthModule {}

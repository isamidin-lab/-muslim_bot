import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CourseService } from './course.service';
import { CreateCourseDto, CreateModuleDto, CreateLessonDto } from './dto/course.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PaginationQuery } from '../../common/interfaces/pagination.interface';
@ApiTags('courses') @Controller('courses')
export class CourseController {
  constructor(private svc: CourseService) {}
  @Post() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('TENANT_ADMIN') @ApiBearerAuth() @ApiOperation({ summary: 'Create course' }) async create(@TenantId() tid: string, @Body() dto: CreateCourseDto) { return this.svc.create(tid, dto); }
  @Get() @UseGuards(JwtAuthGuard) @ApiBearerAuth() @ApiOperation({ summary: 'List courses' }) async findAll(@TenantId() tid: string, @Query() q: PaginationQuery) { return this.svc.findAll(tid, q); }
  @Public() @Get(':id') @ApiOperation({ summary: 'Get course' }) async findOne(@Param('id') id: string, @Query('tenantId') tid: string) { return this.svc.findOne(id, tid); }
  @Put(':id') @UseGuards(JwtAuthGuard, RolesGuard) @Roles('TENANT_ADMIN') @ApiBearerAuth() async update(@Param('id') id: string, @TenantId() tid: string, @Body() dto: any) { return this.svc.update(id, tid, dto); }
  @Delete(':id') @UseGuards(JwtAuthGuard, RolesGuard) @Roles('TENANT_ADMIN') @ApiBearerAuth() async remove(@Param('id') id: string, @TenantId() tid: string) { return this.svc.remove(id, tid); }
  @Post(':courseId/modules') @UseGuards(JwtAuthGuard, RolesGuard) @Roles('TENANT_ADMIN') @ApiBearerAuth() async addModule(@Param('courseId') cid: string, @Body() dto: CreateModuleDto) { return this.svc.addModule(cid, dto); }
  @Post('/modules/:moduleId/lessons') @UseGuards(JwtAuthGuard, RolesGuard) @Roles('TENANT_ADMIN') @ApiBearerAuth() async addLesson(@Param('moduleId') mid: string, @Body() dto: CreateLessonDto) { return this.svc.addLesson(mid, dto); }
}

import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class CreateCourseDto { @ApiProperty() @IsString() title: string; @ApiPropertyOptional() @IsOptional() @IsString() description?: string; @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean; }
export class CreateModuleDto { @ApiProperty() @IsString() title: string; @ApiPropertyOptional() @IsOptional() @IsNumber() sortOrder?: number; }
export class CreateLessonDto { @ApiProperty() @IsString() title: string; @ApiPropertyOptional() @IsOptional() @IsString() content?: string; @ApiPropertyOptional() @IsOptional() @IsString() contentType?: string; @ApiPropertyOptional() @IsOptional() @IsBoolean() isFree?: boolean; @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean; }

import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SearchRoomsQueryDto {
  @ApiPropertyOptional({ example: 'Tel Aviv' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 2, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  guests?: number;

  @ApiPropertyOptional({ example: 200, minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 800, minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}

import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 12;
}

export class SortQueryDto {
  @IsOptional()
  @IsIn(['latest', 'easiest', 'hardest', 'name', 'popular'])
  sort?: 'latest' | 'easiest' | 'hardest' | 'name' | 'popular' = 'latest';
}

export class SearchQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(['all', 'available', 'limited', 'discontinued', 'tiered', 'single'])
  availability?: string;

  @IsOptional()
  @IsIn(['1', '2', '3', '4', '5'])
  difficulty?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn(['latest', 'easiest', 'hardest', 'name', 'popular'])
  sort?: 'latest' | 'easiest' | 'hardest' | 'name' | 'popular' = 'latest';
}

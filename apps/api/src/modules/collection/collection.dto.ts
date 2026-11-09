import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  TIER_LEVEL,
  USER_ACHIEVEMENT_STATUS,
  type TierLevel,
  type UserAchievementStatus,
} from '@gach/shared';

export class UpsertAchievementDto {
  @IsOptional()
  @IsEnum(USER_ACHIEVEMENT_STATUS)
  status?: UserAchievementStatus;

  @IsOptional()
  @IsEnum(TIER_LEVEL)
  tierLevel?: TierLevel | null;

  @IsOptional()
  @IsDateString()
  acquiredAt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}

export class FavoriteDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class ProgressDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '当前数量必须是非负整数' })
  @Min(0, { message: '当前数量必须是非负整数' })
  currentCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '目标数量必须是非负整数' })
  @Min(0, { message: '目标数量必须是非负整数' })
  targetCount?: number | null;

  @IsOptional()
  @IsEnum(TIER_LEVEL)
  targetTier?: TierLevel | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

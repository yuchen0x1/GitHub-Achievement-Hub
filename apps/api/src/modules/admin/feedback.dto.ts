import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SubmitFeedbackDto {
  @IsOptional()
  @IsIn(['BUG', 'SUGGESTION', 'CORRECTION', 'QUESTION', 'OTHER'])
  type?: 'BUG' | 'SUGGESTION' | 'CORRECTION' | 'QUESTION' | 'OTHER';

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  subject!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10_000)
  content!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(320)
  email?: string;
}

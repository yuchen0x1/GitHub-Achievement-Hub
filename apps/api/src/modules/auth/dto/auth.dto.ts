import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email!: string;

  @IsString()
  @MinLength(8, { message: '密码至少 8 位' })
  @MaxLength(128, { message: '密码过长' })
  password!: string;

  @IsString()
  @MinLength(1, { message: '请填写昵称' })
  @MaxLength(60, { message: '昵称过长' })
  displayName!: string;
}

export class LoginDto {
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email!: string;

  @IsString()
  @MinLength(1, { message: '请输入密码' })
  password!: string;
}

export class GithubCallbackDto {
  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  state?: string;
}

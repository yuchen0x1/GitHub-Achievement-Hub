import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AuthUser } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role: string;
    displayName: string;
  }): Promise<AuthUser> {
    // 每次请求校验账号状态，被停用或删除的账号立即失效
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, displayName: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('账号不存在或已被停用');
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
    };
  }
}

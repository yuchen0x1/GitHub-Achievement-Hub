import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/metadata.decorator';

/** 角色守卫：校验 @Roles('ADMIN') 声明的角色 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user?: { role?: string } }>();
    const role = request.user?.role;
    if (!role || !required.includes(role)) {
      throw new ForbiddenException('没有执行该操作的权限');
    }
    return true;
  }
}

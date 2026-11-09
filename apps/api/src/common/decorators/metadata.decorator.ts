import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** 标记接口无需登录即可访问 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ROLES_KEY = 'roles';
/** 标记接口所需角色 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const PUBLIC_ROUTE = 'publicRoute';

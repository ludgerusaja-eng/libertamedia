import { UserRole } from '../storage/ProductionRepository';

export type Permission =
  | 'article:create'
  | 'article:edit'
  | 'article:review'
  | 'article:publish'
  | 'article:archive'
  | 'submission:review'
  | 'submission:publish'
  | 'comment:moderate'
  | 'media:upload'
  | 'settings:manage'
  | 'users:manage'
  | 'audit:read';

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  SUPER_ADMIN: [
    'article:create', 'article:edit', 'article:review', 'article:publish', 'article:archive',
    'submission:review', 'submission:publish', 'comment:moderate', 'media:upload',
    'settings:manage', 'users:manage', 'audit:read'
  ],
  MANAGING_EDITOR: [
    'article:create', 'article:edit', 'article:review', 'article:publish', 'article:archive',
    'submission:review', 'submission:publish', 'comment:moderate', 'media:upload', 'audit:read'
  ],
  EDITOR: [
    'article:create', 'article:edit', 'article:review', 'article:publish', 'article:archive',
    'submission:review', 'submission:publish', 'comment:moderate', 'media:upload'
  ],
  REPORTER: ['article:create', 'article:edit', 'media:upload'],
  CONTRIBUTOR: ['article:create', 'article:edit', 'media:upload'],
  MODERATOR: ['comment:moderate', 'media:upload']
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function assertPermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    const error = new Error(`Forbidden: role ${role} cannot perform ${permission}`);
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }
}

export function permissionsForRole(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

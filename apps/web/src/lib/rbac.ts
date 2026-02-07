import prisma from '@/lib/prisma';

export const ROLE_NAMES = { USER: 'USER', ADMIN: 'ADMIN' } as const;
export const PLAN_NAMES = { FREE: 'FREE', PRO: 'PRO', BIZ: 'BIZ' } as const;

export function isAdmin(roleNames: string[]): boolean {
  return roleNames.includes(ROLE_NAMES.ADMIN);
}

export function hasRole(roleNames: string[], roleName: string): boolean {
  return roleNames.includes(roleName);
}

export function hasPermission(permissions: string[], action: string): boolean {
  return permissions.includes(action);
}

export async function getUserRoleNames(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: { select: { name: true } } },
  });
  return user?.roles.map((r): string => r.name) ?? [];
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      roles: {
        select: {
          permissions: { select: { action: true } },
        },
      },
    },
  });

  if (!user) return [];

  const actions = new Set<string>();
  for (const role of user.roles) {
    for (const perm of role.permissions) {
      actions.add(perm.action);
    }
  }
  return [...actions];
}

import { type Prisma, prisma } from '@workspace/db';
import { createAuditLog } from '@/services/admin/audit-logs.service';
import type { ActivityType, UserActivityItem, UserActivityResponse } from '@/types/activity';
import type { AdminUserInfo, AdminUsersResponse } from '@/types/admin';

// ============================================================================
// Types
// ============================================================================

export interface GetUsersInput {
  search?: string;
  role?: 'USER' | 'ADMIN';
  cursor?: string;
  limit: number;
}

export interface UpdateUserRolesInput {
  userId: string;
  roles: string[];
  changedById: string;
}

export interface UpdateUserPlanInput {
  userId: string;
  planName: string;
  changedById: string;
}

export interface GetUserActivityInput {
  userId: string;
  type?: ActivityType | 'all';
  cursor?: string;
  limit: number;
}

export interface UserDetailInfo {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  roles: Array<{ id: string; name: string }>;
  plan: { id: string; name: string } | null;
  createdAt: string;
  _count: { accommodations: number };
}

export interface UserDetailResponse {
  user: UserDetailInfo;
  allRoles: Array<{ id: string; name: string }>;
  allPlans: Array<{ id: string; name: string }>;
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getUsers(input: GetUsersInput): Promise<AdminUsersResponse> {
  const { search, role, cursor, limit } = input;

  const where: Prisma.UserWhereInput = {};

  if (role) {
    where.roles = { some: { name: role } };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      roles: { select: { name: true } },
      plan: { select: { name: true } },
      createdAt: true,
      _count: {
        select: {
          accommodations: true,
        },
      },
    },
  });

  const total = cursor ? undefined : await prisma.user.count({ where });

  const hasMore = users.length > limit;
  const items = hasMore ? users.slice(0, limit) : users;

  return {
    users: items.map(
      (user: (typeof items)[0]): AdminUserInfo => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        roles: user.roles.map((r: { name: string }): string => r.name),
        planName: user.plan?.name ?? null,
        createdAt: user.createdAt.toISOString(),
        _count: user._count,
      }),
    ),
    nextCursor: hasMore ? items[items.length - 1].id : null,
    ...(total !== undefined ? { total } : {}),
  };
}

export async function getUserDetail(userId: string): Promise<UserDetailResponse | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      roles: { select: { id: true, name: true } },
      plan: { select: { id: true, name: true } },
      createdAt: true,
      _count: {
        select: {
          accommodations: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const [allRoles, allPlans] = await Promise.all([
    prisma.role.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.plan.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      roles: user.roles,
      plan: user.plan,
      createdAt: user.createdAt.toISOString(),
      _count: user._count,
    },
    allRoles,
    allPlans,
  };
}

export interface UpdateUserRolesResult {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  roles: string[];
  planName: string | null;
  createdAt: string;
  _count: { accommodations: number };
}

export async function updateUserRoles(input: UpdateUserRolesInput): Promise<UpdateUserRolesResult> {
  const { userId, roles, changedById } = input;

  const oldUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: { select: { name: true } } },
  });

  if (!oldUser) {
    throw new Error('User not found');
  }

  const oldRoles = oldUser.roles.map((r: { name: string }): string => r.name);

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      roles: {
        set: roles.map((name: string): { name: string } => ({ name })),
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      roles: { select: { name: true } },
      plan: { select: { name: true } },
      createdAt: true,
      _count: {
        select: {
          accommodations: true,
        },
      },
    },
  });

  await createAuditLog({
    actorId: changedById,
    targetId: userId,
    entityType: 'User',
    action: 'role.assign',
    oldValue: oldRoles,
    newValue: roles,
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    roles: user.roles.map((r: { name: string }): string => r.name),
    planName: user.plan?.name ?? null,
    createdAt: user.createdAt.toISOString(),
    _count: user._count,
  };
}

export interface UpdateUserPlanResult {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  roles: string[];
  planName: string | null;
  createdAt: string;
  _count: { accommodations: number };
}

export async function updateUserPlan(input: UpdateUserPlanInput): Promise<UpdateUserPlanResult> {
  const { userId, planName, changedById } = input;

  const plan = await prisma.plan.findUnique({ where: { name: planName }, select: { id: true } });
  if (!plan) {
    throw new Error('Plan not found');
  }

  const oldUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: { select: { name: true } } },
  });

  if (!oldUser) {
    throw new Error('User not found');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { planId: plan.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      roles: { select: { name: true } },
      plan: { select: { name: true } },
      createdAt: true,
      _count: { select: { accommodations: true } },
    },
  });

  await createAuditLog({
    actorId: changedById,
    targetId: userId,
    entityType: 'User',
    action: 'plan.change',
    oldValue: oldUser.plan?.name ?? undefined,
    newValue: planName,
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    roles: user.roles.map((r: { name: string }): string => r.name),
    planName: user.plan?.name ?? null,
    createdAt: user.createdAt.toISOString(),
    _count: user._count,
  };
}

export async function checkUserExists(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  return user !== null;
}

export async function getUserActivity(input: GetUserActivityInput): Promise<UserActivityResponse> {
  const { userId, type: typeFilter, cursor, limit } = input;

  const activities: UserActivityItem[] = [];

  let cursorDate: Date | null = null;
  let cursorType: string | null = null;
  let cursorId: string | null = null;
  if (cursor) {
    const parts = cursor.split(':');
    if (parts.length === 3) {
      cursorType = parts[0];
      cursorId = parts[1];
      cursorDate = new Date(parts[2]);
    }
  }

  const shouldFetchAudit = !typeFilter || typeFilter === 'all' || typeFilter === 'audit';
  const shouldFetchCheck = !typeFilter || typeFilter === 'all' || typeFilter === 'check';
  const shouldFetchAccommodation = !typeFilter || typeFilter === 'all' || typeFilter === 'accommodation';

  if (shouldFetchAudit) {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        targetId: userId,
        ...(cursorDate && cursorType === 'audit' && cursorId
          ? {
              OR: [{ createdAt: { lt: cursorDate } }, { createdAt: cursorDate, id: { lt: cursorId } }],
            }
          : cursorDate
            ? { createdAt: { lte: cursorDate } }
            : {}),
      },
      take: limit + 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        action: true,
        oldValue: true,
        newValue: true,
        createdAt: true,
        actor: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    for (const log of auditLogs) {
      activities.push({
        id: `audit:${log.id}`,
        type: 'audit',
        action: log.action,
        createdAt: log.createdAt.toISOString(),
        actor: log.actor,
        oldValue: log.oldValue,
        newValue: log.newValue,
      });
    }
  }

  if (shouldFetchCheck) {
    const checkLogs = await prisma.checkLog.findMany({
      where: {
        userId,
        ...(cursorDate && cursorType === 'check' && cursorId
          ? {
              OR: [{ createdAt: { lt: cursorDate } }, { createdAt: cursorDate, id: { lt: cursorId } }],
            }
          : cursorDate
            ? { createdAt: { lte: cursorDate } }
            : {}),
      },
      take: limit + 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        status: true,
        price: true,
        createdAt: true,
        accommodation: {
          select: { id: true, name: true, platform: true },
        },
      },
    });

    for (const log of checkLogs) {
      activities.push({
        id: `check:${log.id}`,
        type: 'check',
        action: 'check',
        createdAt: log.createdAt.toISOString(),
        status: log.status,
        price: log.price,
        accommodation: log.accommodation,
      });
    }
  }

  if (shouldFetchAccommodation) {
    const accommodations = await prisma.accommodation.findMany({
      where: {
        userId,
        ...(cursorDate && cursorType === 'accommodation' && cursorId
          ? {
              OR: [{ createdAt: { lt: cursorDate } }, { createdAt: cursorDate, id: { lt: cursorId } }],
            }
          : cursorDate
            ? { createdAt: { lte: cursorDate } }
            : {}),
      },
      take: limit + 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        name: true,
        platform: true,
        createdAt: true,
      },
    });

    for (const acc of accommodations) {
      activities.push({
        id: `accommodation:${acc.id}`,
        type: 'accommodation',
        action: 'accommodation.create',
        createdAt: acc.createdAt.toISOString(),
        accommodationName: acc.name,
        platform: acc.platform,
      });
    }
  }

  activities.sort((a: UserActivityItem, b: UserActivityItem): number => {
    const dateCompare = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (dateCompare !== 0) return dateCompare;
    return b.id.localeCompare(a.id);
  });

  const hasNextPage = activities.length > limit;
  const resultActivities = activities.slice(0, limit);

  let nextCursor: string | null = null;
  if (hasNextPage && resultActivities.length > 0) {
    const lastItem = resultActivities[resultActivities.length - 1];
    const [type, id] = lastItem.id.split(':');
    nextCursor = `${type}:${id}:${lastItem.createdAt}`;
  }

  let total: number | undefined;
  if (!cursor) {
    const [auditCount, checkCount, accCount] = await Promise.all([
      shouldFetchAudit ? prisma.auditLog.count({ where: { targetId: userId } }) : 0,
      shouldFetchCheck ? prisma.checkLog.count({ where: { userId } }) : 0,
      shouldFetchAccommodation ? prisma.accommodation.count({ where: { userId } }) : 0,
    ]);
    total = auditCount + checkCount + accCount;
  }

  return {
    activities: resultActivities,
    nextCursor,
    ...(total !== undefined && { total }),
  };
}

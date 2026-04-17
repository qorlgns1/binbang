import { Accommodation, AuditLog, CheckLog, Plan, Role, User, getDataSource } from '@workspace/db';
import { NotFoundError } from '@workspace/shared/errors';
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

  const ds = await getDataSource();

  const qb = ds
    .getRepository(User)
    .createQueryBuilder('u')
    .leftJoinAndSelect('u.roles', 'role')
    .leftJoinAndSelect('u.plan', 'plan')
    .orderBy('u.createdAt', 'DESC')
    .take(limit + 1);

  if (role) {
    qb.andWhere((sub) => {
      const roleQb = sub
        .subQuery()
        .select('1')
        .from('UserRole', 'ur')
        .innerJoin(Role, 'r', 'r.id = ur.roleId')
        .where('ur.userId = u.id')
        .andWhere('r.name = :roleName')
        .getQuery();
      return `EXISTS ${roleQb}`;
    });
    qb.setParameter('roleName', role);
  }

  if (search) {
    qb.andWhere('(UPPER(u.name) LIKE :search OR UPPER(u.email) LIKE :search)', {
      search: `%${search.toUpperCase()}%`,
    });
  }

  if (cursor) {
    const cursorItem = await ds
      .getRepository(User)
      .findOne({ where: { id: cursor }, select: { id: true, createdAt: true } });
    if (cursorItem) {
      qb.andWhere('(u.createdAt < :cursorDate OR (u.createdAt = :cursorDate AND u.id < :cursorId))', {
        cursorDate: cursorItem.createdAt,
        cursorId: cursor,
      });
    }
  }

  const users = await qb.getMany();

  let total: number | undefined;
  if (!cursor) {
    const countQb = ds.getRepository(User).createQueryBuilder('u').leftJoin('u.roles', 'role');
    if (role) {
      countQb.andWhere((sub) => {
        const roleQb = sub
          .subQuery()
          .select('1')
          .from('UserRole', 'ur')
          .innerJoin(Role, 'r', 'r.id = ur.roleId')
          .where('ur.userId = u.id')
          .andWhere('r.name = :roleName')
          .getQuery();
        return `EXISTS ${roleQb}`;
      });
      countQb.setParameter('roleName', role);
    }
    if (search) {
      countQb.andWhere('(UPPER(u.name) LIKE :search OR UPPER(u.email) LIKE :search)', {
        search: `%${search.toUpperCase()}%`,
      });
    }
    total = await countQb.getCount();
  }

  const hasMore = users.length > limit;
  const items = hasMore ? users.slice(0, limit) : users;

  // accommodation counts
  const userIds = items.map((u) => u.id);
  const accCounts =
    userIds.length > 0
      ? await ds
          .getRepository(Accommodation)
          .createQueryBuilder('a')
          .select('a.userId', 'userId')
          .addSelect('COUNT(*)', 'cnt')
          .where('a.userId IN (:...userIds)', { userIds })
          .groupBy('a.userId')
          .getRawMany<{ userId: string; cnt: string }>()
      : [];
  const accCountMap = new Map(accCounts.map((r) => [r.userId, Number(r.cnt)]));

  return {
    users: items.map(
      (user): AdminUserInfo => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        roles: user.roles.map((r) => r.name),
        planName: user.plan?.name ?? null,
        createdAt: user.createdAt.toISOString(),
        _count: { accommodations: accCountMap.get(user.id) ?? 0 },
      }),
    ),
    nextCursor: hasMore ? items[items.length - 1].id : null,
    ...(total !== undefined ? { total } : {}),
  };
}

export async function getUserDetail(userId: string): Promise<UserDetailResponse | null> {
  const ds = await getDataSource();

  const user = await ds.getRepository(User).findOne({
    where: { id: userId },
    relations: { roles: true, plan: true },
  });

  if (!user) {
    return null;
  }

  const accCount = await ds.getRepository(Accommodation).count({ where: { userId } });

  const [allRoles, allPlans] = await Promise.all([
    ds.getRepository(Role).find({ order: { name: 'ASC' } }),
    ds.getRepository(Plan).find({ order: { name: 'ASC' } }),
  ]);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      roles: user.roles.map((r) => ({ id: r.id, name: r.name })),
      plan: user.plan ? { id: user.plan.id, name: user.plan.name } : null,
      createdAt: user.createdAt.toISOString(),
      _count: { accommodations: accCount },
    },
    allRoles: allRoles.map((r) => ({ id: r.id, name: r.name })),
    allPlans: allPlans.map((p) => ({ id: p.id, name: p.name })),
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

  const ds = await getDataSource();
  const userRepo = ds.getRepository(User);

  const oldUser = await userRepo.findOne({
    where: { id: userId },
    relations: { roles: true },
  });

  if (!oldUser) {
    throw new NotFoundError('User not found');
  }

  const oldRoles = oldUser.roles.map((r) => r.name);

  // Load Role entities by name
  const roleEntities =
    roles.length > 0
      ? await ds.getRepository(Role).createQueryBuilder('r').where('r.name IN (:...names)', { names: roles }).getMany()
      : [];

  oldUser.roles = roleEntities;
  await userRepo.save(oldUser);

  // Reload to get plan info
  const user = await userRepo.findOne({
    where: { id: userId },
    relations: { roles: true, plan: true },
  });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  await createAuditLog({
    actorId: changedById,
    targetId: userId,
    entityType: 'User',
    action: 'role.assign',
    oldValue: oldRoles,
    newValue: roles,
  });

  const accCount = await ds.getRepository(Accommodation).count({ where: { userId } });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    roles: user.roles.map((r) => r.name),
    planName: user.plan?.name ?? null,
    createdAt: user.createdAt.toISOString(),
    _count: { accommodations: accCount },
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

  const ds = await getDataSource();

  const plan = await ds.getRepository(Plan).findOne({ where: { name: planName }, select: { id: true } });
  if (!plan) {
    throw new NotFoundError('Plan not found');
  }

  const oldUser = await ds.getRepository(User).findOne({
    where: { id: userId },
    relations: { plan: true },
    select: { id: true, plan: { name: true } },
  });

  if (!oldUser) {
    throw new NotFoundError('User not found');
  }

  await ds.getRepository(User).update({ id: userId }, { planId: plan.id });

  const user = await ds.getRepository(User).findOne({
    where: { id: userId },
    relations: { roles: true, plan: true },
  });
  if (!user) {
    throw new NotFoundError('User not found');
  }

  await createAuditLog({
    actorId: changedById,
    targetId: userId,
    entityType: 'User',
    action: 'plan.change',
    oldValue: oldUser.plan?.name ?? undefined,
    newValue: planName,
  });

  const accCount = await ds.getRepository(Accommodation).count({ where: { userId } });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    roles: user.roles.map((r) => r.name),
    planName: user.plan?.name ?? null,
    createdAt: user.createdAt.toISOString(),
    _count: { accommodations: accCount },
  };
}

export async function checkUserExists(userId: string): Promise<boolean> {
  const ds = await getDataSource();
  const user = await ds.getRepository(User).findOne({
    where: { id: userId },
    select: { id: true },
  });
  return user !== null;
}

export async function getUserActivity(input: GetUserActivityInput): Promise<UserActivityResponse> {
  const { userId, type: typeFilter, cursor, limit } = input;

  const ds = await getDataSource();
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
    const qb = ds
      .getRepository(AuditLog)
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.actor', 'actor')
      .where('a.targetId = :userId', { userId })
      .orderBy('a.createdAt', 'DESC')
      .addOrderBy('a.id', 'DESC')
      .take(limit + 1);

    if (cursorDate && cursorType === 'audit' && cursorId) {
      qb.andWhere('(a.createdAt < :cursorDate OR (a.createdAt = :cursorDate AND a.id < :cursorId))', {
        cursorDate,
        cursorId,
      });
    } else if (cursorDate) {
      qb.andWhere('a.createdAt <= :cursorDate', { cursorDate });
    }

    const auditLogs = await qb.getMany();

    for (const log of auditLogs) {
      activities.push({
        id: `audit:${log.id}`,
        type: 'audit',
        action: log.action,
        createdAt: log.createdAt.toISOString(),
        actor: log.actor
          ? { id: log.actor.id, name: log.actor.name, email: log.actor.email, image: log.actor.image }
          : null,
        oldValue: log.oldValue,
        newValue: log.newValue,
      });
    }
  }

  if (shouldFetchCheck) {
    const qb = ds
      .getRepository(CheckLog)
      .createQueryBuilder('c')
      .innerJoinAndSelect('c.accommodation', 'acc')
      .where('c.userId = :userId', { userId })
      .orderBy('c.createdAt', 'DESC')
      .addOrderBy('c.id', 'DESC')
      .take(limit + 1);

    if (cursorDate && cursorType === 'check' && cursorId) {
      qb.andWhere('(c.createdAt < :cursorDate OR (c.createdAt = :cursorDate AND c.id < :cursorId))', {
        cursorDate,
        cursorId,
      });
    } else if (cursorDate) {
      qb.andWhere('c.createdAt <= :cursorDate', { cursorDate });
    }

    const checkLogs = await qb.getMany();

    for (const log of checkLogs) {
      activities.push({
        id: `check:${log.id}`,
        type: 'check',
        action: 'check',
        createdAt: log.createdAt.toISOString(),
        status: log.status,
        price: log.price,
        accommodation: {
          id: log.accommodation.id,
          name: log.accommodation.name,
          platform: log.accommodation.platform,
        },
      });
    }
  }

  if (shouldFetchAccommodation) {
    const qb = ds
      .getRepository(Accommodation)
      .createQueryBuilder('a')
      .where('a.userId = :userId', { userId })
      .orderBy('a.createdAt', 'DESC')
      .addOrderBy('a.id', 'DESC')
      .take(limit + 1);

    if (cursorDate && cursorType === 'accommodation' && cursorId) {
      qb.andWhere('(a.createdAt < :cursorDate OR (a.createdAt = :cursorDate AND a.id < :cursorId))', {
        cursorDate,
        cursorId,
      });
    } else if (cursorDate) {
      qb.andWhere('a.createdAt <= :cursorDate', { cursorDate });
    }

    const accommodations = await qb.getMany();

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
      shouldFetchAudit ? ds.getRepository(AuditLog).count({ where: { targetId: userId } }) : 0,
      shouldFetchCheck ? ds.getRepository(CheckLog).count({ where: { userId } }) : 0,
      shouldFetchAccommodation ? ds.getRepository(Accommodation).count({ where: { userId } }) : 0,
    ]);
    total = auditCount + checkCount + accCount;
  }

  return {
    activities: resultActivities,
    nextCursor,
    ...(total !== undefined && { total }),
  };
}

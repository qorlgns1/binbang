import { QuotaKey, prisma } from '@workspace/db';

// ============================================================================
// Types
// ============================================================================

export interface AdminPlanItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: string;
  quotas: Array<{ key: string; value: number }>;
  _count: { users: number };
}

export interface CreatePlanInput {
  name: string;
  description?: string | null;
  price: number;
  interval: string;
  maxAccommodations: number;
  checkIntervalMin: number;
}

export interface UpdatePlanInput {
  name?: string;
  description?: string | null;
  price?: number;
  interval?: string;
  maxAccommodations?: number;
  checkIntervalMin?: number;
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getAdminPlans(): Promise<AdminPlanItem[]> {
  const plans = await prisma.plan.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      interval: true,
      quotas: {
        select: {
          key: true,
          value: true,
        },
      },
      _count: {
        select: { users: true },
      },
    },
    orderBy: { price: 'asc' },
  });

  return plans;
}

export async function createAdminPlan(input: CreatePlanInput): Promise<AdminPlanItem> {
  const { name, description, price, interval, maxAccommodations, checkIntervalMin } = input;

  const existing = await prisma.plan.findUnique({ where: { name }, select: { id: true } });
  if (existing) {
    throw new Error('Plan name already exists');
  }

  const plan = await prisma.plan.create({
    data: {
      name,
      description: description ?? null,
      price,
      interval,
      quotas: {
        create: [
          { key: QuotaKey.MAX_ACCOMMODATIONS, value: maxAccommodations },
          { key: QuotaKey.CHECK_INTERVAL_MIN, value: checkIntervalMin },
        ],
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      interval: true,
      quotas: { select: { key: true, value: true } },
      _count: { select: { users: true } },
    },
  });

  return plan;
}

export async function updateAdminPlan(id: string, input: UpdatePlanInput): Promise<AdminPlanItem> {
  const { name, description, price, interval, maxAccommodations, checkIntervalMin } = input;

  const existing = await prisma.plan.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!existing) {
    throw new Error('Plan not found');
  }

  if (name && name !== existing.name) {
    const duplicate = await prisma.plan.findUnique({ where: { name }, select: { id: true } });
    if (duplicate) {
      throw new Error('Plan name already exists');
    }
  }

  await prisma.plan.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price }),
      ...(interval !== undefined && { interval }),
    },
    select: { id: true },
  });

  if (maxAccommodations !== undefined) {
    await prisma.planQuota.upsert({
      where: { planId_key: { planId: id, key: QuotaKey.MAX_ACCOMMODATIONS } },
      update: { value: maxAccommodations },
      create: { planId: id, key: QuotaKey.MAX_ACCOMMODATIONS, value: maxAccommodations },
      select: { id: true },
    });
  }

  if (checkIntervalMin !== undefined) {
    await prisma.planQuota.upsert({
      where: { planId_key: { planId: id, key: QuotaKey.CHECK_INTERVAL_MIN } },
      update: { value: checkIntervalMin },
      create: { planId: id, key: QuotaKey.CHECK_INTERVAL_MIN, value: checkIntervalMin },
      select: { id: true },
    });
  }

  const updatedPlan = await prisma.plan.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      interval: true,
      quotas: { select: { key: true, value: true } },
      _count: { select: { users: true } },
    },
  });

  return updatedPlan;
}

export async function deleteAdminPlan(id: string): Promise<void> {
  const plan = await prisma.plan.findUnique({
    where: { id },
    select: { _count: { select: { users: true } } },
  });

  if (!plan) {
    throw new Error('Plan not found');
  }

  if (plan._count.users > 0) {
    throw new Error(`Cannot delete plan with ${plan._count.users} active users`);
  }

  await prisma.plan.delete({ where: { id }, select: { id: true } });
}

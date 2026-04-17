import { Plan, PlanQuota, QuotaKey, getDataSource } from '@workspace/db';
import { ConflictError, NotFoundError } from '@workspace/shared/errors';

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
// Helper
// ============================================================================

async function buildPlanItem(planId: string): Promise<AdminPlanItem> {
  const ds = await getDataSource();

  const plan = await ds.getRepository(Plan).findOne({
    where: { id: planId },
    relations: { quotas: true },
  });

  if (!plan) {
    throw new NotFoundError('Plan not found');
  }

  const userCount = await ds
    .getRepository(Plan)
    .createQueryBuilder('p')
    .leftJoin('p.users', 'u')
    .where('p.id = :id', { id: planId })
    .select('COUNT(u.id)', 'cnt')
    .getRawOne<{ cnt: string }>();

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    price: plan.price,
    interval: plan.interval,
    quotas: plan.quotas.map((q) => ({ key: q.key, value: q.value })),
    _count: { users: Number(userCount?.cnt ?? 0) },
  };
}

// ============================================================================
// Service Functions
// ============================================================================

export async function getAdminPlans(): Promise<AdminPlanItem[]> {
  const ds = await getDataSource();

  const plans = await ds.getRepository(Plan).find({
    relations: { quotas: true },
    order: { price: 'ASC' },
  });

  const userCounts = await ds
    .getRepository(Plan)
    .createQueryBuilder('p')
    .leftJoin('p.users', 'u')
    .select('p.id', 'planId')
    .addSelect('COUNT(u.id)', 'cnt')
    .groupBy('p.id')
    .getRawMany<{ planId: string; cnt: string }>();

  const countMap = new Map(userCounts.map((r) => [r.planId, Number(r.cnt)]));

  return plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    description: plan.description,
    price: plan.price,
    interval: plan.interval,
    quotas: plan.quotas.map((q) => ({ key: q.key, value: q.value })),
    _count: { users: countMap.get(plan.id) ?? 0 },
  }));
}

export async function createAdminPlan(input: CreatePlanInput): Promise<AdminPlanItem> {
  const { name, description, price, interval, maxAccommodations, checkIntervalMin } = input;

  const ds = await getDataSource();

  const existing = await ds.getRepository(Plan).findOne({ where: { name }, select: { id: true } });
  if (existing) {
    throw new ConflictError('Plan name already exists');
  }

  const planRepo = ds.getRepository(Plan);
  const plan = planRepo.create({
    name,
    description: description ?? null,
    price,
    interval,
  });
  await planRepo.save(plan);

  const quotaRepo = ds.getRepository(PlanQuota);
  await quotaRepo.save([
    quotaRepo.create({ planId: plan.id, key: QuotaKey.MAX_ACCOMMODATIONS, value: maxAccommodations }),
    quotaRepo.create({ planId: plan.id, key: QuotaKey.CHECK_INTERVAL_MIN, value: checkIntervalMin }),
  ]);

  return buildPlanItem(plan.id);
}

export async function updateAdminPlan(id: string, input: UpdatePlanInput): Promise<AdminPlanItem> {
  const { name, description, price, interval, maxAccommodations, checkIntervalMin } = input;

  const ds = await getDataSource();
  const planRepo = ds.getRepository(Plan);

  const existing = await planRepo.findOne({ where: { id }, select: { id: true, name: true } });
  if (!existing) {
    throw new NotFoundError('Plan not found');
  }

  if (name && name !== existing.name) {
    const duplicate = await planRepo.findOne({ where: { name }, select: { id: true } });
    if (duplicate) {
      throw new ConflictError('Plan name already exists');
    }
  }

  const planUpdate: Partial<Plan> = {};
  if (name !== undefined) planUpdate.name = name;
  if (description !== undefined) planUpdate.description = description;
  if (price !== undefined) planUpdate.price = price;
  if (interval !== undefined) planUpdate.interval = interval;

  if (Object.keys(planUpdate).length > 0) {
    await planRepo.update({ id }, planUpdate);
  }

  if (maxAccommodations !== undefined) {
    await ds
      .getRepository(PlanQuota)
      .upsert({ planId: id, key: QuotaKey.MAX_ACCOMMODATIONS, value: maxAccommodations }, ['planId', 'key']);
  }

  if (checkIntervalMin !== undefined) {
    await ds
      .getRepository(PlanQuota)
      .upsert({ planId: id, key: QuotaKey.CHECK_INTERVAL_MIN, value: checkIntervalMin }, ['planId', 'key']);
  }

  return buildPlanItem(id);
}

export async function deleteAdminPlan(id: string): Promise<void> {
  const ds = await getDataSource();
  const planRepo = ds.getRepository(Plan);

  const plan = await planRepo.findOne({ where: { id }, select: { id: true } });
  if (!plan) {
    throw new NotFoundError('Plan not found');
  }

  const userCount = await planRepo
    .createQueryBuilder('p')
    .leftJoin('p.users', 'u')
    .where('p.id = :id', { id })
    .select('COUNT(u.id)', 'cnt')
    .getRawOne<{ cnt: string }>();

  const count = Number(userCount?.cnt ?? 0);
  if (count > 0) {
    throw new ConflictError(`Cannot delete plan with ${count} active users`);
  }

  await planRepo.delete({ id });
}

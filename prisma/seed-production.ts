/**
 * 운영 환경용 시드 스크립트
 *
 * 운영 환경에서 필수로 실행해야 하는 데이터만 포함합니다:
 * - RBAC: Roles, Permissions, Plans, PlanQuotas
 * - System Settings
 * - Platform Selectors & Patterns
 *
 * 실행: pnpm db:seed:production
 */
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

import { PrismaClient } from '@/generated/prisma/client';
import type { QuotaKey } from '@/generated/prisma/enums';

import {
  SEED_PERMISSIONS,
  SEED_PLANS,
  SEED_PLAN_QUOTAS,
  SEED_PLATFORM_PATTERNS,
  SEED_PLATFORM_SELECTORS,
  SEED_ROLES,
  SYSTEM_SETTINGS,
} from './constants';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? '',
});

const prisma = new PrismaClient({ adapter });

export async function seedProduction() {
  console.log('🌱 Seeding production data...');

  // ── RBAC: Roles ──
  for (const role of SEED_ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: { name: role.name, description: role.description },
    });
  }
  console.log(`   ✓ Roles: ${SEED_ROLES.length}`);

  // ── RBAC: Permissions ──
  for (const perm of SEED_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { action: perm.action },
      update: {
        description: perm.description,
        roles: { set: perm.roles.map((name) => ({ name })) },
      },
      create: {
        action: perm.action,
        description: perm.description,
        roles: { connect: perm.roles.map((name) => ({ name })) },
      },
    });
  }
  console.log(`   ✓ Permissions: ${SEED_PERMISSIONS.length}`);

  // ── RBAC: Plans ──
  for (const plan of SEED_PLANS) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {
        description: plan.description,
        price: plan.price,
        interval: plan.interval,
        roles: { set: plan.roles.map((name) => ({ name })) },
      },
      create: {
        name: plan.name,
        description: plan.description,
        price: plan.price,
        interval: plan.interval,
        roles: { connect: plan.roles.map((name) => ({ name })) },
      },
    });
  }
  console.log(`   ✓ Plans: ${SEED_PLANS.length}`);

  // ── RBAC: PlanQuotas ──
  for (const quota of SEED_PLAN_QUOTAS) {
    const plan = await prisma.plan.findUnique({ where: { name: quota.planName } });
    if (!plan) continue;

    await prisma.planQuota.upsert({
      where: { planId_key: { planId: plan.id, key: quota.key as QuotaKey } },
      update: { value: quota.value },
      create: { planId: plan.id, key: quota.key as QuotaKey, value: quota.value },
    });
  }
  console.log(`   ✓ PlanQuotas: ${SEED_PLAN_QUOTAS.length}`);

  // ── System Settings ──
  for (const setting of SYSTEM_SETTINGS) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: {
        value: setting.value,
        type: setting.type,
        category: setting.category,
        description: setting.description,
      },
      create: setting,
    });
  }
  console.log(`   ✓ SystemSettings: ${SYSTEM_SETTINGS.length}`);

  // ── Platform Selectors ──
  let selectorCreated = 0;
  for (const selector of SEED_PLATFORM_SELECTORS) {
    const existing = await prisma.platformSelector.findUnique({
      where: {
        platform_category_name: {
          platform: selector.platform,
          category: selector.category,
          name: selector.name,
        },
      },
    });

    if (!existing) {
      await prisma.platformSelector.create({
        data: {
          platform: selector.platform,
          category: selector.category,
          name: selector.name,
          selector: selector.selector,
          extractorCode: selector.extractorCode,
          priority: selector.priority,
          description: selector.description,
        },
      });
      selectorCreated++;
    }
  }
  console.log(`   ✓ PlatformSelectors: ${selectorCreated} created (${SEED_PLATFORM_SELECTORS.length} total)`);

  // ── Platform Patterns ──
  let patternCreated = 0;
  for (const pattern of SEED_PLATFORM_PATTERNS) {
    const existing = await prisma.platformPattern.findUnique({
      where: {
        platform_patternType_pattern: {
          platform: pattern.platform,
          patternType: pattern.patternType,
          pattern: pattern.pattern,
        },
      },
    });

    if (!existing) {
      await prisma.platformPattern.create({
        data: {
          platform: pattern.platform,
          patternType: pattern.patternType,
          pattern: pattern.pattern,
          locale: pattern.locale,
          priority: pattern.priority,
        },
      });
      patternCreated++;
    }
  }
  console.log(`   ✓ PlatformPatterns: ${patternCreated} created (${SEED_PLATFORM_PATTERNS.length} total)`);

  console.log('✅ Production seeding completed!');
}

// 직접 실행 시
if (import.meta.url === `file://${process.argv[1]}`) {
  seedProduction()
    .catch((e) => {
      console.error('❌ Production seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

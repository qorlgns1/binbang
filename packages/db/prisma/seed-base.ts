/**
 * 베이스 시드 스크립트
 *
 * 운영/개발 서버 공통으로 필요한 베이스 데이터만 포함합니다:
 * - RBAC: Roles, Permissions, Plans, PlanQuotas
 * - System Settings
 * - Form Question Mappings
 * - Platform Selectors & Patterns
 *
 * 실행: pnpm db:seed:base (root) 또는 pnpm --filter @workspace/db db:seed:base
 */
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

import { PrismaClient } from '@/generated/prisma/client';
import type { QuotaKey } from '@/generated/prisma/enums';

import {
  SEED_DESTINATIONS,
  SEED_FORM_QUESTION_MAPPINGS,
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

export async function seedBase() {
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
        // 운영 중 Admin에서 변경한 value는 유지한다.
        // seed는 기본 메타데이터(type/category/description/range) 동기화만 담당.
        type: setting.type,
        category: setting.category,
        description: setting.description,
        minValue: setting.minValue,
        maxValue: setting.maxValue,
      },
      create: setting,
    });
  }
  console.log(`   ✓ SystemSettings: ${SYSTEM_SETTINGS.length}`);

  // ── Form Question Mappings ──
  for (const mapping of SEED_FORM_QUESTION_MAPPINGS) {
    await prisma.formQuestionMapping.upsert({
      where: {
        formKey_field: {
          formKey: mapping.formKey,
          field: mapping.field,
        },
      },
      update: {
        questionItemId: mapping.questionItemId,
        questionTitle: mapping.questionTitle,
        expectedAnswer: mapping.expectedAnswer,
        isActive: mapping.isActive,
      },
      create: {
        formKey: mapping.formKey,
        field: mapping.field,
        questionItemId: mapping.questionItemId,
        questionTitle: mapping.questionTitle,
        expectedAnswer: mapping.expectedAnswer,
        isActive: mapping.isActive,
      },
    });
  }
  console.log(`   ✓ FormQuestionMappings: ${SEED_FORM_QUESTION_MAPPINGS.length}`);

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

  // ── Travel Destinations ──
  let destUpserted = 0;
  for (const dest of SEED_DESTINATIONS) {
    await prisma.destination.upsert({
      where: { slug: dest.slug },
      update: {
        nameKo: dest.nameKo,
        nameEn: dest.nameEn,
        country: dest.country,
        countryCode: dest.countryCode,
        latitude: dest.latitude,
        longitude: dest.longitude,
        currency: dest.currency,
        description: { ko: dest.descriptionKo, en: dest.descriptionEn },
        highlights: { ko: dest.highlightsKo, en: dest.highlightsEn },
        published: true,
      },
      create: {
        slug: dest.slug,
        nameKo: dest.nameKo,
        nameEn: dest.nameEn,
        country: dest.country,
        countryCode: dest.countryCode,
        latitude: dest.latitude,
        longitude: dest.longitude,
        currency: dest.currency,
        description: { ko: dest.descriptionKo, en: dest.descriptionEn },
        highlights: { ko: dest.highlightsKo, en: dest.highlightsEn },
        published: true,
      },
    });
    destUpserted++;
  }
  console.log(`   ✓ Destinations: ${destUpserted}`);

  console.log('✅ Production seeding completed!');
}

// 직접 실행 시
if (import.meta.url === `file://${process.argv[1]}`) {
  seedBase()
    .catch((e) => {
      console.error('❌ Production seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

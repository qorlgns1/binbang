import 'dotenv/config';

import type { DataSource } from 'typeorm';
import { In } from 'typeorm';

import {
  Destination,
  FormQuestionMapping,
  Permission,
  Plan,
  PlanQuota,
  PlatformPattern,
  PlatformSelector,
  Role,
  SystemSettings,
} from '../src/index.ts';
import type { QuotaKey } from '../src/index.ts';
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
} from '../src/constants/index.ts';
import { destroyDataSource, getManagedDataSource, upsertEntity } from './seed-helpers.ts';

export async function seedBase(existingDataSource?: DataSource): Promise<void> {
  const { ds, shouldDestroy } = await getManagedDataSource(existingDataSource);

  try {
    console.log('🌱 Seeding base data...');

    const roleRepo = ds.getRepository(Role);
    const permissionRepo = ds.getRepository(Permission);
    const planRepo = ds.getRepository(Plan);
    const planQuotaRepo = ds.getRepository(PlanQuota);
    const settingsRepo = ds.getRepository(SystemSettings);
    const mappingRepo = ds.getRepository(FormQuestionMapping);
    const selectorRepo = ds.getRepository(PlatformSelector);
    const patternRepo = ds.getRepository(PlatformPattern);
    const destinationRepo = ds.getRepository(Destination);

    for (const role of SEED_ROLES) {
      await upsertEntity(roleRepo, { where: { name: role.name } }, role);
    }
    console.log(`   ✓ Roles: ${SEED_ROLES.length}`);

    for (const permission of SEED_PERMISSIONS) {
      const roles = await roleRepo.findBy({ name: In([...permission.roles]) });
      await upsertEntity(
        permissionRepo,
        {
          where: { action: permission.action },
          relations: { roles: true },
        },
        {
          action: permission.action,
          description: permission.description,
          roles,
        },
      );
    }
    console.log(`   ✓ Permissions: ${SEED_PERMISSIONS.length}`);

    for (const plan of SEED_PLANS) {
      const roles = await roleRepo.findBy({ name: In([...plan.roles]) });
      await upsertEntity(
        planRepo,
        {
          where: { name: plan.name },
          relations: { roles: true },
        },
        {
          name: plan.name,
          description: plan.description,
          price: plan.price,
          interval: plan.interval,
          roles,
        },
      );
    }
    console.log(`   ✓ Plans: ${SEED_PLANS.length}`);

    for (const quota of SEED_PLAN_QUOTAS) {
      const plan = await planRepo.findOne({ where: { name: quota.planName } });
      if (!plan) {
        throw new Error(`Missing plan for quota seed: ${quota.planName}`);
      }

      await upsertEntity(
        planQuotaRepo,
        { where: { planId: plan.id, key: quota.key as QuotaKey } },
        {
          planId: plan.id,
          key: quota.key as QuotaKey,
          value: quota.value,
        },
      );
    }
    console.log(`   ✓ PlanQuotas: ${SEED_PLAN_QUOTAS.length}`);

    for (const setting of SYSTEM_SETTINGS) {
      const existing = await settingsRepo.findOne({ where: { key: setting.key } });
      if (existing) {
        await settingsRepo.save(
          settingsRepo.merge(existing, {
            type: setting.type,
            category: setting.category,
            description: setting.description,
            minValue: setting.minValue,
            maxValue: setting.maxValue,
          }),
        );
      } else {
        await settingsRepo.save(settingsRepo.create(setting));
      }
    }
    console.log(`   ✓ SystemSettings: ${SYSTEM_SETTINGS.length}`);

    for (const mapping of SEED_FORM_QUESTION_MAPPINGS) {
      await upsertEntity(
        mappingRepo,
        {
          where: {
            formKey: mapping.formKey,
            field: mapping.field,
          },
        },
        {
          formKey: mapping.formKey,
          field: mapping.field,
          questionItemId: mapping.questionItemId,
          questionTitle: mapping.questionTitle,
          expectedAnswer: mapping.expectedAnswer,
          isActive: mapping.isActive,
        },
      );
    }
    console.log(`   ✓ FormQuestionMappings: ${SEED_FORM_QUESTION_MAPPINGS.length}`);

    for (const selector of SEED_PLATFORM_SELECTORS) {
      await upsertEntity(
        selectorRepo,
        {
          where: {
            platform: selector.platform,
            category: selector.category,
            name: selector.name,
          },
        },
        {
          platform: selector.platform,
          category: selector.category,
          name: selector.name,
          selector: selector.selector,
          extractorCode: selector.extractorCode,
          priority: selector.priority,
          description: selector.description,
          isActive: true,
        },
      );
    }
    console.log(`   ✓ PlatformSelectors: ${SEED_PLATFORM_SELECTORS.length}`);

    for (const pattern of SEED_PLATFORM_PATTERNS) {
      await upsertEntity(
        patternRepo,
        {
          where: {
            platform: pattern.platform,
            patternType: pattern.patternType,
            pattern: pattern.pattern,
          },
        },
        {
          platform: pattern.platform,
          patternType: pattern.patternType,
          pattern: pattern.pattern,
          locale: pattern.locale,
          priority: pattern.priority,
          isActive: true,
        },
      );
    }
    console.log(`   ✓ PlatformPatterns: ${SEED_PLATFORM_PATTERNS.length}`);

    for (const destination of SEED_DESTINATIONS) {
      await upsertEntity(
        destinationRepo,
        { where: { slug: destination.slug } },
        {
          slug: destination.slug,
          nameKo: destination.nameKo,
          nameEn: destination.nameEn,
          country: destination.country,
          countryCode: destination.countryCode,
          latitude: destination.latitude,
          longitude: destination.longitude,
          currency: destination.currency,
          description: { ko: destination.descriptionKo, en: destination.descriptionEn },
          highlights: { ko: destination.highlightsKo, en: destination.highlightsEn },
          published: true,
        },
      );
    }
    console.log(`   ✓ Destinations: ${SEED_DESTINATIONS.length}`);

    console.log('✅ Base seeding completed.');
  } finally {
    await destroyDataSource(ds, shouldDestroy);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedBase().catch((error) => {
    console.error('❌ Base seeding failed:', error);
    process.exit(1);
  });
}

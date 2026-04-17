import {
  AffiliatePreferenceAuditLog,
  ConversationAffiliateOverride,
  ConversationPreference,
  LessThan,
  TravelConversation,
  User,
  getDataSource,
} from '@workspace/db';

interface ResolveAffiliateLinksEnabledInput {
  conversationId?: string;
  userId?: string | null;
}

function normalizeOptionalId(value?: string | null): string {
  return value?.trim() ?? '';
}

function toAccountDefault(enabled: boolean | null | undefined): boolean {
  return enabled ?? true;
}

function resolveEffectiveAffiliateEnabled(override: ConversationAffiliateOverride, accountDefault: boolean): boolean {
  if (override === ConversationAffiliateOverride.enabled) return true;
  if (override === ConversationAffiliateOverride.disabled) return false;
  return accountDefault;
}

export interface ConversationAffiliatePreferenceResult {
  conversationId: string;
  override: ConversationAffiliateOverride;
  effectiveEnabled: boolean;
}

export async function resolveAffiliateLinksEnabled(
  input: ResolveAffiliateLinksEnabledInput,
): Promise<{ enabled: boolean; source: 'default' | 'account' | 'conversation_override' }> {
  const userId = normalizeOptionalId(input.userId);
  const conversationId = normalizeOptionalId(input.conversationId);

  if (!userId) {
    return { enabled: true, source: 'default' };
  }

  const ds = await getDataSource();
  const user = await ds.getRepository(User).findOne({
    where: { id: userId },
    select: { affiliateLinksEnabled: true },
  });

  const accountDefault = toAccountDefault(user?.affiliateLinksEnabled);

  if (!conversationId) {
    return { enabled: accountDefault, source: 'account' };
  }

  const preference = await ds.getRepository(ConversationPreference).findOne({
    where: { conversationId },
    select: { affiliateOverride: true },
  });

  if (preference?.affiliateOverride === ConversationAffiliateOverride.enabled) {
    return { enabled: true, source: 'conversation_override' };
  }

  if (preference?.affiliateOverride === ConversationAffiliateOverride.disabled) {
    return { enabled: false, source: 'conversation_override' };
  }

  return { enabled: accountDefault, source: 'account' };
}

export async function getConversationAffiliatePreference(
  conversationId: string,
  actorUserId: string,
): Promise<ConversationAffiliatePreferenceResult | null> {
  const ds = await getDataSource();
  const conversation = await ds.getRepository(TravelConversation).findOne({
    where: { id: conversationId },
    select: {
      id: true,
      userId: true,
      preference: {
        affiliateOverride: true,
      },
    },
    relations: { preference: true },
  });

  if (!conversation || conversation.userId !== actorUserId) {
    return null;
  }

  const account = await ds.getRepository(User).findOne({
    where: { id: actorUserId },
    select: { affiliateLinksEnabled: true },
  });

  const override = conversation.preference?.affiliateOverride ?? ConversationAffiliateOverride.inherit;
  const accountDefault = toAccountDefault(account?.affiliateLinksEnabled);
  const effectiveEnabled = resolveEffectiveAffiliateEnabled(override, accountDefault);

  return {
    conversationId,
    override,
    effectiveEnabled,
  };
}

export async function upsertConversationAffiliatePreference(input: {
  conversationId: string;
  actorUserId: string;
  nextOverride: ConversationAffiliateOverride;
}): Promise<ConversationAffiliatePreferenceResult | null> {
  const ds = await getDataSource();
  return ds.transaction(async (manager) => {
    const convRepo = manager.getRepository(TravelConversation);
    const prefRepo = manager.getRepository(ConversationPreference);
    const auditRepo = manager.getRepository(AffiliatePreferenceAuditLog);

    const conversation = await convRepo.findOne({
      where: { id: input.conversationId },
      select: {
        id: true,
        userId: true,
        preference: {
          affiliateOverride: true,
        },
      },
      relations: { preference: true },
    });

    if (!conversation || conversation.userId !== input.actorUserId) {
      return null;
    }

    const account = await manager.getRepository(User).findOne({
      where: { id: input.actorUserId },
      select: { affiliateLinksEnabled: true },
    });

    const previousOverride = conversation.preference?.affiliateOverride ?? ConversationAffiliateOverride.inherit;

    let preference = await prefRepo.findOne({ where: { conversationId: input.conversationId } });
    if (preference) {
      preference.affiliateOverride = input.nextOverride;
    } else {
      preference = prefRepo.create({
        conversationId: input.conversationId,
        affiliateOverride: input.nextOverride,
      });
    }
    await prefRepo.save(preference);

    if (previousOverride !== input.nextOverride) {
      const auditEntry = auditRepo.create({
        conversationId: input.conversationId,
        actorUserId: input.actorUserId,
        fromValue: previousOverride,
        toValue: input.nextOverride,
      });
      await auditRepo.save(auditEntry);
    }

    const accountDefault = toAccountDefault(account?.affiliateLinksEnabled);
    const effectiveEnabled = resolveEffectiveAffiliateEnabled(input.nextOverride, accountDefault);

    return {
      conversationId: input.conversationId,
      override: input.nextOverride,
      effectiveEnabled,
    };
  });
}

export async function getAccountAffiliateLinksEnabled(userId: string): Promise<boolean | null> {
  const ds = await getDataSource();
  const user = await ds.getRepository(User).findOne({
    where: { id: userId },
    select: { affiliateLinksEnabled: true },
  });

  if (!user) return null;
  return user.affiliateLinksEnabled;
}

export async function setAccountAffiliateLinksEnabled(userId: string, enabled: boolean): Promise<boolean | null> {
  const ds = await getDataSource();
  const result = await ds.getRepository(User).update({ id: userId }, { affiliateLinksEnabled: enabled });

  if ((result.affected ?? 0) === 0) return null;
  return enabled;
}

export async function purgeExpiredAffiliatePreferenceAuditLogs(retentionDays: number): Promise<number> {
  const days = Number.isFinite(retentionDays) ? Math.max(1, Math.floor(retentionDays)) : 365;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const ds = await getDataSource();
  const result = await ds.getRepository(AffiliatePreferenceAuditLog).delete({
    changedAt: LessThan(cutoff),
  });

  return result.affected ?? 0;
}

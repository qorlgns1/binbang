import { ConversationAffiliateOverride, prisma } from '@workspace/db';

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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { affiliateLinksEnabled: true },
  });

  const accountDefault = toAccountDefault(user?.affiliateLinksEnabled);

  if (!conversationId) {
    return { enabled: accountDefault, source: 'account' };
  }

  const preference = await prisma.conversationPreference.findUnique({
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
  const conversation = await prisma.travelConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      userId: true,
      preference: {
        select: {
          affiliateOverride: true,
        },
      },
    },
  });

  if (!conversation || conversation.userId !== actorUserId) {
    return null;
  }

  const account = await prisma.user.findUnique({
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
  return prisma.$transaction(async (tx) => {
    const conversation = await tx.travelConversation.findUnique({
      where: { id: input.conversationId },
      select: {
        id: true,
        userId: true,
        preference: {
          select: { affiliateOverride: true },
        },
      },
    });

    if (!conversation || conversation.userId !== input.actorUserId) {
      return null;
    }

    const account = await tx.user.findUnique({
      where: { id: input.actorUserId },
      select: { affiliateLinksEnabled: true },
    });

    const previousOverride = conversation.preference?.affiliateOverride ?? ConversationAffiliateOverride.inherit;

    await tx.conversationPreference.upsert({
      where: { conversationId: input.conversationId },
      create: {
        conversationId: input.conversationId,
        affiliateOverride: input.nextOverride,
      },
      update: {
        affiliateOverride: input.nextOverride,
      },
      select: { conversationId: true },
    });

    if (previousOverride !== input.nextOverride) {
      await tx.affiliatePreferenceAuditLog.create({
        data: {
          conversationId: input.conversationId,
          actorUserId: input.actorUserId,
          fromValue: previousOverride,
          toValue: input.nextOverride,
        },
      });
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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { affiliateLinksEnabled: true },
  });

  if (!user) return null;
  return user.affiliateLinksEnabled;
}

export async function setAccountAffiliateLinksEnabled(userId: string, enabled: boolean): Promise<boolean | null> {
  const updated = await prisma.user.updateMany({
    where: { id: userId },
    data: {
      affiliateLinksEnabled: enabled,
    },
  });

  if (updated.count === 0) return null;
  return enabled;
}

export async function purgeExpiredAffiliatePreferenceAuditLogs(retentionDays: number): Promise<number> {
  const days = Number.isFinite(retentionDays) ? Math.max(1, Math.floor(retentionDays)) : 365;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await prisma.affiliatePreferenceAuditLog.deleteMany({
    where: {
      changedAt: {
        lt: cutoff,
      },
    },
  });

  return result.count;
}

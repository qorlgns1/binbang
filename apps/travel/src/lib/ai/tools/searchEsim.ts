import { tool } from 'ai';
import { z } from 'zod';

import { generateAffiliateLink } from '@/lib/api/awinLinkBuilder';
import { isAffiliateCtaEnabled } from '@/lib/featureFlags';
import type { EsimEntity, SearchEsimResult } from '@/lib/types';
import { getFirstAdvertiserByCategory } from '@/services/affiliate-advertiser.service';
import { resolveAffiliateLinksEnabled } from '@/services/conversation-preference.service';

import { buildClickref, buildEsimDescription, buildStableProductId, resolveAffiliateProvider } from './affiliateUtils';
import type { TravelToolsOptions } from './affiliateUtils';

export function createSearchEsimTool({ conversationId, userId }: TravelToolsOptions) {
  return tool({
    description:
      'Search for travel eSIM options with affiliate purchase links. Use this tool for eSIM, roaming data, mobile data pass, or internet plan questions.',
    inputSchema: z.object({
      query: z.string().describe('eSIM search query (e.g., "best esim for japan", "europe data esim")'),
      location: z.string().optional().describe('Travel destination or region (e.g., "Tokyo, Japan", "Europe")'),
      tripDays: z.number().int().min(1).max(90).optional().describe('Planned trip duration in days'),
      dataNeedGB: z.number().min(1).max(100).optional().describe('Estimated data need in GB'),
    }),
    execute: async ({ query, location, tripDays, dataNeedGB }): Promise<SearchEsimResult> => {
      const ctaFeatureEnabled = isAffiliateCtaEnabled();
      const affiliateLinkPolicy = await resolveAffiliateLinksEnabled({ conversationId, userId });
      const preferenceEnabled = affiliateLinkPolicy.enabled;
      const canUseAffiliateLink = ctaFeatureEnabled && preferenceEnabled;

      const advertiser = canUseAffiliateLink ? await getFirstAdvertiserByCategory('esim') : null;
      const productId = buildStableProductId('esim', [
        query,
        location ?? 'global',
        `${tripDays ?? ''}`,
        `${dataNeedGB ?? ''}`,
      ]);

      let affiliateLink: string | undefined;
      if (advertiser) {
        const linkResult = await generateAffiliateLink({
          advertiserId: advertiser.advertiserId,
          clickref: buildClickref(conversationId, productId),
        });
        affiliateLink = linkResult?.url;
      }

      const ctaEnabled = !!affiliateLink;
      const provider = resolveAffiliateProvider({
        ctaFeatureEnabled,
        preferenceEnabled,
        directProvider: advertiser ? `awin:${advertiser.advertiserId}` : undefined,
        disabledProvider: 'awin_disabled:esim',
        pendingProvider: 'awin_pending:esim',
      });

      const primary: EsimEntity = {
        productId,
        name: advertiser ? `${advertiser.name} eSIM` : '여행용 eSIM',
        description: buildEsimDescription(location, tripDays, dataNeedGB),
        coverage: location?.trim() || 'Global',
        affiliateLink,
        isAffiliate: !!affiliateLink,
        advertiserName: affiliateLink ? advertiser?.name : undefined,
      };

      return { primary, ctaEnabled, provider };
    },
  });
}

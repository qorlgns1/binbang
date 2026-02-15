import { z } from 'zod';

const PRICING_PLATFORMS = ['AIRBNB', 'AGODA', 'OTHER'] as const;
const DURATION_BUCKETS = ['LE_24H', 'BETWEEN_24H_72H', 'BETWEEN_72H_7D', 'GT_7D'] as const;
const DIFFICULTY_LEVELS = ['L', 'M', 'H'] as const;
const URGENCY_BUCKETS = ['D0_D1', 'D2_D3', 'D4_PLUS'] as const;
const FREQUENCY_BUCKETS = ['F15M', 'F30M', 'F60M_PLUS'] as const;

export const pricingInputSchema = z.object({
  platform: z.enum(PRICING_PLATFORMS),
  durationBucket: z.enum(DURATION_BUCKETS),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  urgencyBucket: z.enum(URGENCY_BUCKETS),
  frequencyBucket: z.enum(FREQUENCY_BUCKETS),
});

export const savePricingQuoteSchema = pricingInputSchema.extend({
  changeReason: z.string().trim().min(1, 'changeReason is required'),
});

export type PricingInputPayload = z.infer<typeof pricingInputSchema>;
export type SavePricingQuotePayload = z.infer<typeof savePricingQuoteSchema>;

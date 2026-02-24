import { tool } from 'ai';
import { z } from 'zod';

import { fetchExchangeRate } from '@/lib/api/exchangeRate';

export const getExchangeRateTool = tool({
  description: 'Get current exchange rates between currencies. Useful for budget planning and cost comparisons.',
  inputSchema: z.object({
    baseCurrency: z.string().describe('Base currency code (e.g., "USD", "KRW", "EUR")'),
    targetCurrencies: z.array(z.string()).describe('Target currency codes (e.g., ["THB", "JPY", "EUR"])'),
  }),
  execute: async ({ baseCurrency, targetCurrencies }) => {
    return fetchExchangeRate({ baseCurrency, targetCurrencies });
  },
});

import { tool } from 'ai';
import { z } from 'zod';

import { fetchExchangeRate } from '@/lib/api/exchangeRate';
import { fetchWeatherHistory } from '@/lib/api/weather';
import { searchGooglePlaces } from '@/lib/api/places';

export const travelTools = {
  searchPlaces: tool({
    description:
      'Search for places, attractions, restaurants, hotels, or any point of interest. Returns real data with coordinates, photos, ratings, and reviews.',
    inputSchema: z.object({
      query: z.string().describe('Search query (e.g., "best restaurants in Bangkok", "temples in Kyoto")'),
      location: z.string().optional().describe('Optional location bias (e.g., "Bangkok, Thailand")'),
      type: z
        .enum(['restaurant', 'hotel', 'tourist_attraction', 'museum', 'park', 'cafe', 'general'])
        .optional()
        .describe('Type of place to search for'),
    }),
    execute: async ({ query, location, type }) => {
      return searchGooglePlaces({ query, location, type });
    },
  }),

  getWeatherHistory: tool({
    description:
      'Get historical monthly weather data for a city. Useful for recommending best travel seasons and what to pack.',
    inputSchema: z.object({
      city: z.string().describe('City name (e.g., "Bangkok", "Tokyo", "Paris")'),
      month: z.number().min(1).max(12).optional().describe('Specific month (1-12) to get weather for'),
    }),
    execute: async ({ city, month }) => {
      return fetchWeatherHistory({ city, month });
    },
  }),

  getExchangeRate: tool({
    description: 'Get current exchange rates between currencies. Useful for budget planning and cost comparisons.',
    inputSchema: z.object({
      baseCurrency: z.string().describe('Base currency code (e.g., "USD", "KRW", "EUR")'),
      targetCurrencies: z.array(z.string()).describe('Target currency codes (e.g., ["THB", "JPY", "EUR"])'),
    }),
    execute: async ({ baseCurrency, targetCurrencies }) => {
      return fetchExchangeRate({ baseCurrency, targetCurrencies });
    },
  }),
};

import { tool } from 'ai';
import { z } from 'zod';

import { fetchWeatherHistory } from '@/lib/api/weather';

export const getWeatherHistoryTool = tool({
  description:
    'Get historical monthly weather data for a city. Useful for recommending best travel seasons and what to pack.',
  inputSchema: z.object({
    city: z.string().describe('City name (e.g., "Bangkok", "Tokyo", "Paris")'),
    month: z.number().min(1).max(12).optional().describe('Specific month (1-12) to get weather for'),
  }),
  execute: async ({ city, month }) => {
    return fetchWeatherHistory({ city, month });
  },
});

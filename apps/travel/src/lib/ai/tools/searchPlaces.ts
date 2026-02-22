import { tool } from 'ai';
import { z } from 'zod';

import { searchGooglePlaces } from '@/lib/api/places';

export const searchPlacesTool = tool({
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
});

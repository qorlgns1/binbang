import type { UIMessage } from 'ai';
import { describe, expect, it } from 'vitest';

import { extractMapEntitiesFromMessages } from './chatPanelUtils';

describe('extractMapEntitiesFromMessages', () => {
  it('maps searchAccommodation tool output to map entities', () => {
    const searchAccommodationOutput = {
      affiliate: {
        placeId: 'test-hotel-affiliate',
        name: 'Test Riverside Hotel',
        address: '101 Test Ave, Seoul',
        latitude: 37.5665,
        longitude: 126.978,
        rating: 4.6,
        userRatingsTotal: 2184,
        types: ['lodging', 'hotel'],
        photoUrl: 'https://example.com/riverside.jpg',
        isAffiliate: false,
      },
      alternatives: [
        {
          placeId: 'test-hotel-alt-1',
          name: 'Test Midtown Stay',
          address: '88 Mockingbird Rd, Seoul',
          latitude: 37.57,
          longitude: 126.982,
          rating: 4.2,
          userRatingsTotal: 941,
          types: ['lodging', 'hotel'],
          photoUrl: 'https://example.com/midtown.jpg',
          isAffiliate: false,
        },
      ],
      ctaEnabled: false,
      provider: 'agoda_pending:accommodation',
    };

    const messages = [
      {
        id: 'assistant-1',
        role: 'assistant',
        parts: [
          {
            type: 'tool-searchAccommodation',
            state: 'output-available',
            output: searchAccommodationOutput,
          },
        ],
      },
    ] as unknown as UIMessage[];

    const entities = extractMapEntitiesFromMessages(messages);

    expect(entities.map((entity) => entity.id)).toEqual(['test-hotel-affiliate', 'test-hotel-alt-1']);
    expect(entities.every((entity) => entity.type === 'accommodation')).toBe(true);
  });
});

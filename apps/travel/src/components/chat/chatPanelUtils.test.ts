import type { UIMessage } from 'ai';
import { describe, expect, it } from 'vitest';

import { E2E_STUB_PLACE_IDS, E2E_STUB_SEARCH_ACCOMMODATION_RESULT } from '@/lib/e2e/chatStubFixture';

import { extractMapEntitiesFromMessages } from './chatPanelUtils';

describe('extractMapEntitiesFromMessages', () => {
  it('maps searchAccommodation tool output to map entities', () => {
    const messages = [
      {
        id: 'assistant-1',
        role: 'assistant',
        parts: [
          {
            type: 'tool-searchAccommodation',
            state: 'output-available',
            output: E2E_STUB_SEARCH_ACCOMMODATION_RESULT,
          },
        ],
      },
    ] as unknown as UIMessage[];

    const entities = extractMapEntitiesFromMessages(messages);

    expect(entities.map((entity) => entity.id)).toEqual(E2E_STUB_PLACE_IDS);
    expect(entities.every((entity) => entity.type === 'accommodation')).toBe(true);
  });
});

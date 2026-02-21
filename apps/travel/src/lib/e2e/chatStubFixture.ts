import type { UIMessage } from 'ai';

import type { AccommodationEntity, SearchAccommodationResult } from '@/lib/types';

const E2E_STUB_AFFILIATE: AccommodationEntity = {
  placeId: 'e2e-hotel-affiliate',
  name: 'E2E Riverside Hotel',
  address: '101 Test Ave, Seoul',
  latitude: 37.5665,
  longitude: 126.978,
  rating: 4.6,
  userRatingsTotal: 2184,
  types: ['lodging', 'hotel'],
  photoUrl: 'https://example.com/e2e-riverside.jpg',
  affiliateLink: undefined,
  isAffiliate: false,
  priceAmount: undefined,
  priceCurrency: undefined,
  isAvailable: undefined,
  advertiserName: undefined,
};

const E2E_STUB_ALTERNATIVES: AccommodationEntity[] = [
  {
    placeId: 'e2e-hotel-alt-1',
    name: 'E2E Midtown Stay',
    address: '88 Mockingbird Rd, Seoul',
    latitude: 37.57,
    longitude: 126.982,
    rating: 4.2,
    userRatingsTotal: 941,
    types: ['lodging', 'hotel'],
    photoUrl: 'https://example.com/e2e-midtown.jpg',
    affiliateLink: undefined,
    isAffiliate: false,
    priceAmount: undefined,
    priceCurrency: undefined,
    isAvailable: undefined,
    advertiserName: undefined,
  },
  {
    placeId: 'e2e-hotel-alt-2',
    name: 'E2E Han River View',
    address: '7 Example St, Seoul',
    latitude: 37.562,
    longitude: 126.975,
    rating: 4.4,
    userRatingsTotal: 1320,
    types: ['lodging', 'hotel'],
    photoUrl: 'https://example.com/e2e-hanriver.jpg',
    affiliateLink: undefined,
    isAffiliate: false,
    priceAmount: undefined,
    priceCurrency: undefined,
    isAvailable: undefined,
    advertiserName: undefined,
  },
];

export const E2E_STUB_SEARCH_ACCOMMODATION_RESULT: SearchAccommodationResult = {
  affiliate: E2E_STUB_AFFILIATE,
  alternatives: [...E2E_STUB_ALTERNATIVES],
  ctaEnabled: false,
  provider: 'agoda_pending:accommodation',
};

export const E2E_STUB_PLACE_IDS = [E2E_STUB_AFFILIATE.placeId, ...E2E_STUB_ALTERNATIVES.map((item) => item.placeId)];

export const E2E_STUB_PLACE_NAMES = [E2E_STUB_AFFILIATE.name, ...E2E_STUB_ALTERNATIVES.map((item) => item.name)];

function createMessageId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
}

function createStubAssistantMessage(): UIMessage {
  const toolPart = {
    type: 'tool-searchAccommodation',
    state: 'output-available',
    output: E2E_STUB_SEARCH_ACCOMMODATION_RESULT,
  } as unknown as UIMessage['parts'][number];

  return {
    id: createMessageId('assistant'),
    role: 'assistant',
    parts: [
      {
        type: 'text',
        text: '추천 숙소를 준비했어요. 카드와 지도 마커를 함께 확인해 주세요.',
      },
      toolPart,
    ],
  };
}

export function buildE2EStubChatMessages(existingMessages: UIMessage[], userText: string): UIMessage[] {
  const userMessage: UIMessage = {
    id: createMessageId('user'),
    role: 'user',
    parts: [{ type: 'text', text: userText }],
  };

  return [...existingMessages, userMessage, createStubAssistantMessage()];
}

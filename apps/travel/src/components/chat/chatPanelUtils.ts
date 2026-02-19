import type { UIMessage } from 'ai';

import type { MapEntity, PlaceEntity, SearchAccommodationResult } from '@/lib/types';

export const LAST_CONVERSATION_ID_STORAGE_KEY = 'travel_last_conversation_id';
export const PENDING_RESTORE_STORAGE_KEY = 'travel_pending_restore';
/** CC-03: 24시간 초과 스냅샷은 폐기 (명세 5.2) */
export const PENDING_RESTORE_STALE_MS = 24 * 60 * 60 * 1000;

export interface PendingRestoreSnapshot {
  conversationId: string;
  updatedAt: number;
  preview: string;
}

export interface ConversationSummary {
  id: string;
}

export interface ConversationMessagePayload {
  role: string;
  content: string;
}

export interface ConversationEntityPayload {
  id: string;
  type: string;
  name: string;
  latitude: number;
  longitude: number;
  metadata: unknown;
}

function inferType(types: string[]): MapEntity['type'] {
  if (types.includes('lodging') || types.includes('hotel')) return 'accommodation';
  if (types.includes('restaurant') || types.includes('food')) return 'restaurant';
  if (types.includes('tourist_attraction') || types.includes('museum')) return 'attraction';
  return 'place';
}

function toMapEntity(input: {
  id: string;
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  type: MapEntity['type'];
  photoUrl?: string;
}): MapEntity | null {
  if (input.latitude == null || input.longitude == null) {
    return null;
  }

  return {
    id: input.id,
    name: input.name,
    latitude: input.latitude,
    longitude: input.longitude,
    type: input.type,
    photoUrl: input.photoUrl,
  };
}

function normalizeToolPart(part: UIMessage['parts'][number]): {
  toolName: string;
  state: string;
  output: unknown;
} | null {
  if (part.type === 'dynamic-tool') {
    const dynamicPart = part as { toolName?: string; state?: string; output?: unknown };
    return {
      toolName: dynamicPart.toolName ?? '',
      state: dynamicPart.state ?? '',
      output: dynamicPart.output,
    };
  }

  if (!part.type.startsWith('tool-')) {
    return null;
  }

  const toolPart = part as { state?: string; output?: unknown };
  return {
    toolName: part.type.slice(5),
    state: toolPart.state ?? '',
    output: toolPart.output,
  };
}

export function createConversationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const suffix = Array.from(bytes, (b) => b.toString(36).padStart(2, '0'))
      .join('')
      .slice(0, 10);
    return `conv_${Date.now()}_${suffix}`;
  }
  return `conv_${Date.now()}_${Date.now().toString(36).slice(-6)}`;
}

export function parsePendingRestoreSnapshot(value: string | null): PendingRestoreSnapshot | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<PendingRestoreSnapshot>;
    const conversationId = typeof parsed.conversationId === 'string' ? parsed.conversationId.trim() : '';

    if (!conversationId) {
      return null;
    }

    return {
      conversationId,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
      preview: typeof parsed.preview === 'string' ? parsed.preview : '',
    };
  } catch {
    return null;
  }
}

export function getUserMessagePreview(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role !== 'user') {
      continue;
    }

    const preview = message.parts
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map((part) => part.text)
      .join('')
      .trim();

    if (preview) {
      return preview.slice(0, 80);
    }
  }

  return '';
}

export function isRateLimitErrorMessage(message: string): boolean {
  return message.includes('429') || /rate\s*limit|too\s*many/i.test(message);
}

export function mapConversationMessagesToUiMessages(messages: ConversationMessagePayload[]): UIMessage[] {
  return messages.map((message) => ({
    id: createConversationId(),
    role: message.role as 'user' | 'assistant',
    parts: [{ type: 'text' as const, text: message.content }],
  }));
}

export function mapConversationEntitiesToMapEntities(entities: ConversationEntityPayload[]): MapEntity[] {
  return entities
    .map((entity) =>
      toMapEntity({
        id: entity.id,
        name: entity.name,
        latitude: entity.latitude,
        longitude: entity.longitude,
        type: entity.type as MapEntity['type'],
        photoUrl: (entity.metadata as { photoUrl?: string })?.photoUrl,
      }),
    )
    .filter((entity): entity is MapEntity => entity != null);
}

function extractMapEntitiesFromPlaces(places: PlaceEntity[]): MapEntity[] {
  return places
    .map((place) =>
      toMapEntity({
        id: place.placeId,
        name: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        type: inferType(place.types),
        photoUrl: place.photoUrl,
      }),
    )
    .filter((entity): entity is MapEntity => entity != null);
}

function extractMapEntitiesFromAccommodationResult(data: SearchAccommodationResult): MapEntity[] {
  const entities: MapEntity[] = [];

  if (data.affiliate) {
    const affiliate = toMapEntity({
      id: data.affiliate.placeId,
      name: data.affiliate.name,
      latitude: data.affiliate.latitude,
      longitude: data.affiliate.longitude,
      type: 'accommodation',
      photoUrl: data.affiliate.photoUrl,
    });
    if (affiliate) {
      entities.push(affiliate);
    }
  }

  for (const alternative of data.alternatives) {
    const entity = toMapEntity({
      id: alternative.placeId,
      name: alternative.name,
      latitude: alternative.latitude,
      longitude: alternative.longitude,
      type: 'accommodation',
      photoUrl: alternative.photoUrl,
    });
    if (entity) {
      entities.push(entity);
    }
  }

  return entities;
}

export function extractMapEntitiesFromMessages(messages: UIMessage[]): MapEntity[] {
  const entities: MapEntity[] = [];

  for (const message of messages) {
    for (const part of message.parts) {
      const toolPart = normalizeToolPart(part);
      if (!toolPart || toolPart.state !== 'output-available') {
        continue;
      }

      if (toolPart.toolName === 'searchPlaces' && toolPart.output) {
        const data = toolPart.output as { places?: PlaceEntity[] };
        const places = Array.isArray(data.places) ? data.places : [];
        entities.push(...extractMapEntitiesFromPlaces(places));
      }

      if (toolPart.toolName === 'searchAccommodation' && toolPart.output) {
        const data = toolPart.output as SearchAccommodationResult;
        entities.push(...extractMapEntitiesFromAccommodationResult(data));
      }
    }
  }

  return entities;
}

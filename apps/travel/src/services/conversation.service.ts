import type { Prisma } from '@workspace/db';
import { prisma } from '@workspace/db';

interface SaveMessageParams {
  conversationId?: string;
  sessionId: string;
  userMessage: string;
  assistantMessage: string;
  toolCalls?: unknown[];
  toolResults?: unknown[];
}

export async function saveConversationMessages(params: SaveMessageParams) {
  const { sessionId, userMessage, assistantMessage, toolCalls, toolResults } = params;
  let { conversationId } = params;

  const resultId = await prisma.$transaction(async (tx) => {
    if (!conversationId) {
      const conversation = await tx.travelConversation.create({
        data: {
          sessionId,
          title: userMessage.slice(0, 100),
        },
        select: { id: true },
      });
      conversationId = conversation.id;
    }

    await tx.travelMessage.createMany({
      data: [
        {
          conversationId,
          role: 'user',
          content: userMessage,
        },
        {
          conversationId,
          role: 'assistant',
          content: assistantMessage,
          toolCalls: toolCalls && toolCalls.length > 0 ? JSON.parse(JSON.stringify(toolCalls)) : undefined,
          toolResults: toolResults && toolResults.length > 0 ? JSON.parse(JSON.stringify(toolResults)) : undefined,
        },
      ],
    });

    // Extract entities from tool results and save them
    if (toolResults && toolResults.length > 0) {
      const entities = extractEntitiesFromToolResults(toolResults, conversationId);
      if (entities.length > 0) {
        await tx.travelEntity.createMany({ data: entities });
      }
    }

    return conversationId;
  });

  return resultId;
}

export async function getConversation(conversationId: string) {
  return prisma.travelConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      sessionId: true,
      title: true,
      createdAt: true,
      messages: {
        select: {
          id: true,
          role: true,
          content: true,
          toolCalls: true,
          toolResults: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      entities: {
        select: {
          id: true,
          type: true,
          name: true,
          latitude: true,
          longitude: true,
          metadata: true,
        },
      },
    },
  });
}

export async function getConversationsBySession(sessionId: string) {
  return prisma.travelConversation.findMany({
    where: { sessionId },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
}

interface EntityCreateData {
  conversationId: string;
  type: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  metadata: Prisma.InputJsonValue;
}

function extractEntitiesFromToolResults(toolResults: unknown[], conversationId: string): EntityCreateData[] {
  const entities: EntityCreateData[] = [];

  for (const result of toolResults) {
    if (!result || typeof result !== 'object') continue;

    const resultObj = result as Record<string, unknown>;
    const resultData = resultObj.result as Record<string, unknown> | undefined;
    if (!resultData) continue;

    // Handle searchPlaces results
    const places = resultData.places as Array<Record<string, unknown>> | undefined;
    if (places && Array.isArray(places)) {
      for (const place of places) {
        entities.push({
          conversationId,
          type: inferPlaceType(place.types as string[] | undefined),
          name: (place.name as string) ?? 'Unknown',
          latitude: (place.latitude as number) ?? null,
          longitude: (place.longitude as number) ?? null,
          metadata: {
            address: place.address ?? null,
            rating: place.rating ?? null,
            userRatingsTotal: place.userRatingsTotal ?? null,
            priceLevel: place.priceLevel ?? null,
            photoUrl: place.photoUrl ?? null,
            placeId: place.placeId ?? null,
          } as Prisma.InputJsonValue,
        });
      }
    }
  }

  return entities;
}

function inferPlaceType(types?: string[]): string {
  if (!types || types.length === 0) return 'place';
  if (types.includes('restaurant') || types.includes('food')) return 'restaurant';
  if (types.includes('lodging') || types.includes('hotel')) return 'accommodation';
  if (types.includes('tourist_attraction') || types.includes('museum')) return 'attraction';
  return 'place';
}

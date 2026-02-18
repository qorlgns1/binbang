import type { Prisma } from '@workspace/db';
import { prisma } from '@workspace/db';

interface SaveMessageParams {
  conversationId?: string;
  sessionId: string;
  userId?: string | null;
  userMessage: string;
  assistantMessage: string;
  toolCalls?: unknown[];
  toolResults?: unknown[];
}

export async function saveConversationMessages(params: SaveMessageParams) {
  const { sessionId, userId, userMessage, assistantMessage, toolCalls, toolResults } = params;
  let { conversationId } = params;

  const resultId = await prisma.$transaction(async (tx) => {
    let isNewConversation = false;

    if (conversationId) {
      const existingConversation = await tx.travelConversation.findUnique({
        where: { id: conversationId },
        select: { id: true, userId: true, sessionId: true },
      });

      if (!existingConversation) {
        const conversation = await tx.travelConversation.create({
          data: {
            id: conversationId,
            sessionId,
            userId: userId ?? null,
            title: userMessage.slice(0, 100),
          },
          select: { id: true },
        });
        conversationId = conversation.id;
        isNewConversation = true;
      } else if (userId && existingConversation.userId == null) {
        // 로그인 사용자가 기존 게스트 대화를 이어갈 때 소유권을 즉시 귀속
        await tx.travelConversation.update({
          where: { id: conversationId },
          data: { userId },
        });
      } else if (
        existingConversation.userId != null && existingConversation.userId !== userId
      ) {
        // 다른 유저 소유 대화에는 메시지 추가 불가
        throw new Error('ConversationForbidden');
      } else if (
        existingConversation.userId == null && existingConversation.sessionId !== sessionId
      ) {
        // 다른 게스트 세션의 대화에는 메시지 추가 불가 (sessionId 불일치)
        throw new Error('ConversationForbidden');
      }
    } else {
      const conversation = await tx.travelConversation.create({
        data: {
          sessionId,
          userId: userId ?? null,
          title: userMessage.slice(0, 100),
        },
        select: { id: true },
      });
      conversationId = conversation.id;
      isNewConversation = true;
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

    // messageCount 업데이트
    await tx.travelConversation.update({
      where: { id: conversationId },
      data: {
        messageCount: { increment: 2 }, // user + assistant
      },
      select: { id: true },
    });

    // Extract entities from tool results and save them
    if (toolResults && toolResults.length > 0) {
      const entities = extractEntitiesFromToolResults(toolResults, conversationId);
      if (entities.length > 0) {
        await tx.travelEntity.createMany({ data: entities });
      }
    }

    return { conversationId, isNewConversation };
  });

  return resultId;
}

export async function getConversation(conversationId: string) {
  return prisma.travelConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      sessionId: true,
      userId: true,
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

/**
 * 게스트 세션의 모든 대화를 사용자 계정으로 병합
 */
export async function mergeGuestSessionToUser(sessionId: string, userId: string): Promise<{ mergedCount: number }> {
  return mergeGuestSessionsToUser([sessionId], userId);
}

/**
 * 여러 게스트 세션의 대화를 사용자 계정으로 병합
 */
export async function mergeGuestSessionsToUser(sessionIds: string[], userId: string): Promise<{ mergedCount: number }> {
  if (sessionIds.length === 0) {
    return { mergedCount: 0 };
  }

  const uniqueSessionIds = [...new Set(sessionIds)];
  const result = await prisma.travelConversation.updateMany({
    where: {
      sessionId: {
        in: uniqueSessionIds,
      },
      userId: null, // 게스트 대화만
    },
    data: {
      userId,
    },
  });

  return { mergedCount: result.count };
}

/**
 * 사용자의 모든 대화 조회 (userId 기준)
 *
 * 검색 범위: 제목(title)만 대상으로 한다.
 * 메시지 content 전문 검색은 pg_trgm GIN 인덱스 없이 전체 스캔이 발생하므로
 * Phase 3에서 full-text search 인덱스 적용 후 활성화한다.
 */
export async function getConversationsByUser(userId: string, searchQuery?: string) {
  const trimmedQuery = searchQuery?.trim();
  const where: Prisma.TravelConversationWhereInput = { userId };

  if (trimmedQuery) {
    where.title = {
      contains: trimmedQuery,
      mode: 'insensitive',
    };
  }

  return prisma.travelConversation.findMany({
    where,
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
}

/**
 * 대화 삭제 (소유권 확인 포함)
 * @returns 삭제 성공 여부. 대화가 없거나 소유자가 아니면 false 반환.
 *
 * deleteMany로 소유권 조건을 where절에 포함시켜 read-then-delete 경쟁 조건을 제거한다.
 */
export async function deleteConversation(conversationId: string, userId: string): Promise<boolean> {
  const result = await prisma.travelConversation.deleteMany({
    where: {
      id: conversationId,
      userId,
    },
  });

  return result.count > 0;
}

/**
 * 대화 제목 수정 (소유권 확인 포함)
 * @returns 수정 성공 여부. 대화가 없거나 소유자가 아니면 false 반환.
 */
export async function updateConversationTitle(conversationId: string, userId: string, title: string): Promise<boolean> {
  const result = await prisma.travelConversation.updateMany({
    where: {
      id: conversationId,
      userId,
    },
    data: {
      title,
    },
  });

  return result.count > 0;
}

import type { EntityManager } from '@workspace/db';
import { In, IsNull, TravelConversation, TravelEntity, TravelMessage, getDataSource } from '@workspace/db';
import { ForbiddenError } from '@workspace/shared/errors';

interface EnsureConversationExistsParams {
  conversationId?: string;
  sessionId: string;
  userId?: string | null;
  title?: string | null;
}

interface EnsureConversationExistsResult {
  conversationId: string;
  isNewConversation: boolean;
}

interface SaveMessageParams {
  conversationId?: string;
  sessionId: string;
  userId?: string | null;
  userMessage: string;
  assistantMessage: string;
  toolCalls?: unknown[];
  toolResults?: unknown[];
}

function normalizeConversationTitle(title: string | null | undefined): string | null {
  const normalized = title?.trim();
  return normalized ? normalized.slice(0, 100) : null;
}

async function ensureConversationExistsTx(
  manager: EntityManager,
  params: EnsureConversationExistsParams,
): Promise<EnsureConversationExistsResult> {
  const { sessionId, userId } = params;
  const title = normalizeConversationTitle(params.title);
  const convRepo = manager.getRepository(TravelConversation);
  let { conversationId } = params;
  let isNewConversation = false;

  if (conversationId) {
    const existingConversation = await convRepo.findOne({
      where: { id: conversationId },
      select: { id: true, userId: true, sessionId: true, messageCount: true },
    });

    if (!existingConversation) {
      const conversation = convRepo.create({
        id: conversationId,
        sessionId,
        userId: userId ?? null,
        title,
      });
      await convRepo.save(conversation);
      conversationId = conversation.id;
      isNewConversation = true;
    } else if (userId && existingConversation.userId == null) {
      isNewConversation = existingConversation.messageCount === 0;
      // 로그인 사용자가 기존 게스트 대화를 이어갈 때 소유권을 즉시 귀속
      await convRepo.update({ id: conversationId }, { userId });
    } else if (existingConversation.userId != null && existingConversation.userId !== userId) {
      // 다른 유저 소유 대화에는 접근 불가
      throw new ForbiddenError('ConversationForbidden');
    } else if (existingConversation.userId == null && existingConversation.sessionId !== sessionId) {
      // 다른 게스트 세션의 대화에는 접근 불가
      throw new ForbiddenError('ConversationForbidden');
    } else {
      isNewConversation = existingConversation.messageCount === 0;
    }
  } else {
    const conversation = convRepo.create({
      sessionId,
      userId: userId ?? null,
      title,
    });
    await convRepo.save(conversation);
    conversationId = conversation.id;
    isNewConversation = true;
  }

  if (!conversationId) {
    throw new Error('[travel-conversation] conversation id was not resolved');
  }

  return { conversationId, isNewConversation };
}

export async function ensureConversationExists(
  params: EnsureConversationExistsParams,
): Promise<EnsureConversationExistsResult> {
  const ds = await getDataSource();
  return ds.transaction((manager) => ensureConversationExistsTx(manager, params));
}

export async function saveConversationMessages(params: SaveMessageParams) {
  const { sessionId, userId, userMessage, assistantMessage, toolCalls, toolResults } = params;
  const ds = await getDataSource();

  return ds.transaction(async (manager) => {
    const { conversationId, isNewConversation } = await ensureConversationExistsTx(manager, {
      conversationId: params.conversationId,
      sessionId,
      userId,
      title: userMessage,
    });
    const msgRepo = manager.getRepository(TravelMessage);
    const entityRepo = manager.getRepository(TravelEntity);

    const userMsg = msgRepo.create({
      conversationId,
      role: 'user',
      content: userMessage,
    });
    const assistantMsg = msgRepo.create({
      conversationId,
      role: 'assistant',
      content: assistantMessage,
      toolCalls: toolCalls && toolCalls.length > 0 ? JSON.parse(JSON.stringify(toolCalls)) : undefined,
      toolResults: toolResults && toolResults.length > 0 ? JSON.parse(JSON.stringify(toolResults)) : undefined,
    });
    await msgRepo.save([userMsg, assistantMsg]);

    // user + assistant 메시지 2건 저장분을 원자적으로 반영
    await manager
      .createQueryBuilder()
      .update(TravelConversation)
      .set({ messageCount: () => '"messageCount" + 2' })
      .where('id = :id', { id: conversationId })
      .execute();

    if (toolResults && toolResults.length > 0) {
      const entities = extractEntitiesFromToolResults(toolResults, conversationId);
      if (entities.length > 0) {
        await entityRepo.save(entities.map((entity) => entityRepo.create(entity)));
      }
    }

    return { conversationId, isNewConversation };
  });
}

export async function getConversation(conversationId: string) {
  const ds = await getDataSource();
  return ds.getRepository(TravelConversation).findOne({
    where: { id: conversationId },
    select: {
      id: true,
      sessionId: true,
      userId: true,
      title: true,
      createdAt: true,
      messages: {
        id: true,
        role: true,
        content: true,
        toolCalls: true,
        toolResults: true,
        createdAt: true,
      },
      entities: {
        id: true,
        type: true,
        name: true,
        latitude: true,
        longitude: true,
        metadata: true,
      },
    },
    relations: { messages: true, entities: true },
    order: { messages: { createdAt: 'ASC' } },
  });
}

export async function getConversationOwnership(conversationId: string) {
  const ds = await getDataSource();
  return ds.getRepository(TravelConversation).findOne({
    where: { id: conversationId },
    select: {
      id: true,
      userId: true,
      sessionId: true,
    },
  });
}

interface EntityCreateData {
  conversationId: string;
  type: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  metadata: object;
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
          },
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
  const ds = await getDataSource();
  const result = await ds.getRepository(TravelConversation).update(
    {
      sessionId: In(uniqueSessionIds),
      userId: IsNull(),
    },
    { userId },
  );

  return { mergedCount: result.affected ?? 0 };
}

/**
 * 사용자의 모든 대화 조회 (userId 기준)
 *
 * 검색 범위: 제목(title)만 대상으로 한다.
 * 메시지 content 전문 검색은 pg_trgm GIN 인덱스 없이 전체 스캔이 발생하므로
 * Phase 3에서 full-text search 인덱스 적용 후 활성화한다.
 */
export async function getConversationsByUser(userId: string, searchQuery?: string) {
  const ds = await getDataSource();
  const trimmedQuery = searchQuery?.trim();

  let qb = ds
    .getRepository(TravelConversation)
    .createQueryBuilder('conv')
    .select(['conv.id', 'conv.title', 'conv.createdAt', 'conv.updatedAt', 'conv.messageCount'])
    .where('conv.userId = :userId', { userId });

  if (trimmedQuery) {
    qb = qb.andWhere('UPPER(conv.title) LIKE UPPER(:query)', { query: `%${trimmedQuery}%` });
  }

  return qb.orderBy('conv.updatedAt', 'DESC').take(50).getMany();
}

/**
 * 대화 삭제 (소유권 확인 포함)
 * @returns 삭제 성공 여부. 대화가 없거나 소유자가 아니면 false 반환.
 *
 * 소유권 조건을 where절에 포함시켜 read-then-delete 경쟁 조건을 제거한다.
 */
export async function deleteConversation(conversationId: string, userId: string): Promise<boolean> {
  const ds = await getDataSource();
  const result = await ds.getRepository(TravelConversation).delete({
    id: conversationId,
    userId,
  });

  return (result.affected ?? 0) > 0;
}

/**
 * 대화 제목 수정 (소유권 확인 포함)
 * 제목은 trim 후 최대 100자로 저장 (saveConversationMessages와 동일)
 * @returns 수정 성공 여부. 대화가 없거나 소유자가 아니면 false 반환.
 */
export async function updateConversationTitle(conversationId: string, userId: string, title: string): Promise<boolean> {
  const safeTitle = title.trim().slice(0, 100);
  const ds = await getDataSource();
  const result = await ds.getRepository(TravelConversation).update(
    {
      id: conversationId,
      userId,
    },
    { title: safeTitle },
  );

  return (result.affected ?? 0) > 0;
}

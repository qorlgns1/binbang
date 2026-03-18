import type {
  ConversationEntityPayload,
  ConversationMessagePayload,
  ConversationSummary,
} from '@/components/chat/chatPanelUtils';

interface ConversationDetailResponse {
  conversation: {
    id: string;
    messages: ConversationMessagePayload[];
    entities: ConversationEntityPayload[];
  };
}

export async function fetchConversationDetail(
  conversationId: string,
  options?: { retryCount?: number },
): Promise<ConversationDetailResponse | null> {
  const retryCount = options?.retryCount ?? 0;
  let response: Response | null = null;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      response = await fetch(`/api/conversations/${conversationId}`);
    } catch (error) {
      if (attempt < retryCount) {
        await new Promise((resolve) => {
          setTimeout(resolve, 400 * (attempt + 1));
        });
        continue;
      }
      console.error('Failed to fetch conversation detail:', error);
      return null;
    }

    if (response.ok) {
      break;
    }

    const shouldRetry = (response.status === 403 || response.status === 404) && attempt < retryCount;
    if (!shouldRetry) {
      break;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 400 * (attempt + 1));
    });
  }

  if (!response || !response.ok) {
    return null;
  }

  return response.json() as Promise<ConversationDetailResponse>;
}

export async function findFallbackConversationId(preview: string, excludeId: string): Promise<string | null> {
  const trimmedPreview = preview.trim();
  const urls =
    trimmedPreview.length >= 2
      ? [`/api/conversations?q=${encodeURIComponent(trimmedPreview.slice(0, 32))}`, '/api/conversations']
      : ['/api/conversations'];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as { conversations: ConversationSummary[] };
      const fallback = data.conversations.find((conversation) => conversation.id !== excludeId)?.id ?? null;
      if (fallback) {
        return fallback;
      }
    } catch (error) {
      console.error('Failed to find fallback conversation:', error);
    }
  }

  return null;
}

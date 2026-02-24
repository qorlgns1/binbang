import type { HistoryConversation } from '@/components/history/historySidebarTypes';

export interface HistoryConversationListResponse {
  conversations: HistoryConversation[];
}

export async function fetchHistoryConversations(url: string): Promise<HistoryConversationListResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch');
  }

  return response.json() as Promise<HistoryConversationListResponse>;
}

export async function deleteHistoryConversation(conversationId: string): Promise<void> {
  const response = await fetch(`/api/conversations?id=${conversationId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete conversation');
  }
}

export async function updateHistoryConversationTitle(conversationId: string, title: string): Promise<void> {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new Error('Failed to update title');
  }
}

'use client';

import { useMemo } from 'react';
import useSWR from 'swr';

import {
  fetchHistoryConversations,
  type HistoryConversationListResponse,
} from '@/components/history/historySidebarApi';

interface UseHistoryConversationListOptions {
  open: boolean;
  searchQuery: string;
}

function buildConversationsApiUrl(open: boolean, searchQuery: string): string | null {
  if (!open) {
    return null;
  }

  const trimmedSearchQuery = searchQuery.trim();
  if (trimmedSearchQuery.length > 0) {
    return `/api/conversations?q=${encodeURIComponent(trimmedSearchQuery)}`;
  }

  return '/api/conversations';
}

export function useHistoryConversationList({ open, searchQuery }: UseHistoryConversationListOptions) {
  const conversationsApiUrl = buildConversationsApiUrl(open, searchQuery);
  const { data, error, mutate } = useSWR<HistoryConversationListResponse>(
    conversationsApiUrl,
    fetchHistoryConversations,
  );

  const conversations = useMemo(() => data?.conversations ?? [], [data?.conversations]);
  const isLoading = !data && !error;

  return {
    conversations,
    error,
    isLoading,
    mutate,
  };
}

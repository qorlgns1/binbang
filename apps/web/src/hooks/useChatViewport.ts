'use client';

import { useEffect, useRef } from 'react';

interface UseChatViewportOptions {
  messagesLength: number;
  selectedPlaceId?: string;
}

export function useChatViewport({ messagesLength, selectedPlaceId }: UseChatViewportOptions) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally scroll on message count change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesLength]);

  useEffect(() => {
    if (!selectedPlaceId || !scrollAreaRef.current) {
      return;
    }

    const selectedPlaceElement = scrollAreaRef.current.querySelector(`[data-place-id="${selectedPlaceId}"]`);
    selectedPlaceElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedPlaceId]);

  return {
    messagesEndRef,
    scrollAreaRef,
  };
}

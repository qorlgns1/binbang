'use client';

import { type FormEvent, useCallback } from 'react';
import { toast } from 'sonner';

type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

interface ChatRequestBody {
  sessionId?: string;
  conversationId: string;
}

type SendMessageFn = (message: { text: string }, options?: { body?: ChatRequestBody }) => void;

interface UseChatComposerOptions {
  authStatus: AuthStatus;
  currentConversationId: string;
  input: string;
  isLoading: boolean;
  sendMessage: SendMessageFn;
  sessionId?: string;
  setInput: (value: string) => void;
}

export function useChatComposer({
  authStatus,
  currentConversationId,
  input,
  isLoading,
  sendMessage,
  sessionId,
  setInput,
}: UseChatComposerOptions) {
  const getChatRequestBody = useCallback(
    (): ChatRequestBody => ({
      sessionId,
      conversationId: currentConversationId,
    }),
    [currentConversationId, sessionId],
  );

  const ensureSessionReady = useCallback(() => {
    if (authStatus !== 'authenticated' && sessionId == null) {
      toast.info('세션 준비 중입니다. 잠시 후 다시 시도해 주세요.');
      return false;
    }

    return true;
  }, [authStatus, sessionId]);

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault?.();
      if (!input.trim() || isLoading) {
        return;
      }
      if (!ensureSessionReady()) {
        return;
      }

      const text = input.trim();
      setInput('');
      sendMessage({ text }, { body: getChatRequestBody() });
    },
    [ensureSessionReady, getChatRequestBody, input, isLoading, sendMessage, setInput],
  );

  const handleExampleClick = useCallback(
    (query: string) => {
      if (!ensureSessionReady()) {
        return;
      }

      setInput('');
      sendMessage({ text: query }, { body: getChatRequestBody() });
    },
    [ensureSessionReady, getChatRequestBody, sendMessage, setInput],
  );

  return {
    getChatRequestBody,
    handleSubmit,
    handleExampleClick,
  };
}

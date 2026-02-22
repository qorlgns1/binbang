'use client';

import { useEffect, useRef } from 'react';

interface UseRateLimitLoginPromptOptions {
  authStatus: 'authenticated' | 'unauthenticated' | 'loading';
  errorMessage: string | null;
  isRateLimitError: boolean;
  onPromptLogin: () => void;
}

export function useRateLimitLoginPrompt({
  authStatus,
  errorMessage,
  isRateLimitError,
  onPromptLogin,
}: UseRateLimitLoginPromptOptions) {
  const promptedErrorMessageRef = useRef<string | null>(null);

  useEffect(() => {
    if (!errorMessage) {
      promptedErrorMessageRef.current = null;
      return;
    }

    const shouldPromptLogin = authStatus !== 'authenticated' && isRateLimitError;
    if (!shouldPromptLogin) {
      return;
    }

    if (promptedErrorMessageRef.current === errorMessage) {
      return;
    }

    onPromptLogin();
    promptedErrorMessageRef.current = errorMessage;
  }, [authStatus, errorMessage, isRateLimitError, onPromptLogin]);
}

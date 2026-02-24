'use client';

import { useEffect, useRef } from 'react';

interface UseRateLimitLoginPromptOptions {
  authStatus: 'authenticated' | 'unauthenticated' | 'loading';
  errorKey: string | null;
  isRateLimitError: boolean;
  onPromptLogin: () => void;
}

export function useRateLimitLoginPrompt({
  authStatus,
  errorKey,
  isRateLimitError,
  onPromptLogin,
}: UseRateLimitLoginPromptOptions) {
  const promptedErrorKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!errorKey) {
      promptedErrorKeyRef.current = null;
      return;
    }

    const shouldPromptLogin = authStatus !== 'authenticated' && isRateLimitError;
    if (!shouldPromptLogin) {
      return;
    }

    if (promptedErrorKeyRef.current === errorKey) {
      return;
    }

    onPromptLogin();
    promptedErrorKeyRef.current = errorKey;
  }, [authStatus, errorKey, isRateLimitError, onPromptLogin]);
}

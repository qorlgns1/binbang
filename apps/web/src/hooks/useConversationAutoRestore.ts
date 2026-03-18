'use client';

import { useEffect, useRef } from 'react';

import { consumeRestoreTarget, type RestoreTarget } from '@/hooks/conversationRestoreStorage';
import type { MergeStatus } from '@/hooks/useSessionMerge';

interface UseConversationAutoRestoreOptions {
  restoreAutoEnabled: boolean;
  mergeStatus: MergeStatus;
  hasMessages: boolean;
  onRestoreTarget: (restoreTarget: RestoreTarget) => void;
}

export function useConversationAutoRestore({
  restoreAutoEnabled,
  mergeStatus,
  hasMessages,
  onRestoreTarget,
}: UseConversationAutoRestoreOptions) {
  const hasAutoRestoredConversationRef = useRef(false);

  useEffect(() => {
    if (!restoreAutoEnabled) {
      return;
    }

    if (mergeStatus !== 'done' || hasAutoRestoredConversationRef.current) {
      return;
    }

    hasAutoRestoredConversationRef.current = true;
    if (hasMessages) {
      return;
    }

    const restoreTarget = consumeRestoreTarget();
    if (!restoreTarget) {
      return;
    }

    onRestoreTarget(restoreTarget);
  }, [hasMessages, mergeStatus, onRestoreTarget, restoreAutoEnabled]);
}

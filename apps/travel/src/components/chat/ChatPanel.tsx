'use client';

import { useChat } from '@ai-sdk/react';
import { useSession } from 'next-auth/react';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ChatPanelHeader } from '@/components/chat/ChatPanelHeader';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { ChatPanelErrorBanner, ChatPanelRestoreBanner } from '@/components/chat/ChatPanelSections';
import { extractMapEntitiesFromMessages, isRateLimitErrorMessage } from '@/components/chat/chatPanelUtils';
import { normalizeToolPart } from '@/components/chat/toolPartUtils';
import { HistorySidebar } from '@/components/history/HistorySidebar';
import { useChatComposer } from '@/hooks/useChatComposer';
import { useChatViewport } from '@/hooks/useChatViewport';
import { useChatLoginGate } from '@/hooks/useChatLoginGate';
import { useConversationRestore } from '@/hooks/useConversationRestore';
import { useGuestSession } from '@/hooks/useGuestSession';
import { useRateLimitLoginPrompt } from '@/hooks/useRateLimitLoginPrompt';
import { useSessionMerge } from '@/hooks/useSessionMerge';
import { ApiError, getUserMessage } from '@/lib/apiError';
import { isRestoreAutoEnabled } from '@/lib/featureFlags';
import {
  clearPlannerTrackedAccommodationIds,
  setPlannerTrackedAccommodationIds,
  trackPlannerEvent,
} from '@/lib/plannerTracking';
import type { SearchAccommodationResult } from '@/lib/types';
import { useChatSessionStore } from '@/stores/useChatSessionStore';
import { usePlaceStore } from '@/stores/usePlaceStore';

export type ChatEntryMode = 'planner' | 'chat';
export type PlannerStage = 'entry' | 'loading' | 'chat';

interface PlannerSubmitCycleState {
  baselineMessageCount: number;
  terminalEvent: 'planner_result_viewed' | 'planner_failed' | 'planner_empty_result' | null;
}

interface ChatPanelProps {
  entryMode: ChatEntryMode;
  onPlannerStageChange?: (stage: PlannerStage) => void;
}

export function ChatPanel({ entryMode, onPlannerStageChange }: ChatPanelProps) {
  const locale = useLocale();
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [plannerStage, setPlannerStage] = useState<PlannerStage>(entryMode === 'planner' ? 'entry' : 'chat');

  const { status: authStatus } = useSession();
  const restoreAutoEnabled = isRestoreAutoEnabled();

  const { sessionId, currentConversationId } = useChatSessionStore();
  const { selectedPlaceId, setEntities } = usePlaceStore();

  // 세션 초기화 (store에 sessionId/mergeStatus 기록)
  useGuestSession();
  useSessionMerge();

  const { messages, sendMessage, status, stop, error, regenerate, clearError, setMessages } = useChat();

  const { restoreStatus, handleNewConversation, handleRetryRestore, handleSelectConversation } = useConversationRestore(
    {
      messages,
      restoreAutoEnabled,
      setMessages,
    },
  );

  const { openLoginModalForRateLimit, handleHistoryClick, handleSaveClick } = useChatLoginGate({
    authStatus,
    messagesCount: messages.length,
    onOpenHistory: () => setShowHistory(true),
  });

  const isLoading = status !== 'ready';
  const rawErrorMessage = typeof error?.message === 'string' ? error.message : null;
  const userErrorMessage = error instanceof Error ? getUserMessage(error) : null;
  const isRateLimitError =
    error instanceof ApiError
      ? error.code === 'RATE_LIMITED'
      : rawErrorMessage != null && isRateLimitErrorMessage(rawErrorMessage);
  const rateLimitPromptKey =
    error instanceof ApiError ? `${error.code}:${String(error.status ?? '')}` : rawErrorMessage;

  const { getChatRequestBody, handleSubmit, handleExampleClick } = useChatComposer({
    authStatus,
    currentConversationId,
    input,
    isLoading,
    locale,
    sendMessage,
    sessionId: sessionId ?? undefined,
    setInput,
  });
  const plannerCycleRef = useRef<PlannerSubmitCycleState | null>(null);

  const updatePlannerStage = useCallback((nextStage: PlannerStage) => {
    setPlannerStage((currentStage) => (currentStage === nextStage ? currentStage : nextStage));
  }, []);

  useRateLimitLoginPrompt({
    authStatus,
    errorKey: rateLimitPromptKey,
    isRateLimitError,
    onPromptLogin: openLoginModalForRateLimit,
  });

  const { messagesEndRef, scrollAreaRef } = useChatViewport({
    messagesLength: messages.length,
    selectedPlaceId,
  });

  useEffect(() => {
    setEntities(extractMapEntitiesFromMessages(messages));
  }, [messages, setEntities]);

  useEffect(() => {
    if (!currentConversationId) {
      return;
    }

    clearPlannerTrackedAccommodationIds();
    plannerCycleRef.current = null;
  }, [currentConversationId]);

  useEffect(() => {
    if (entryMode !== 'planner') {
      updatePlannerStage('chat');
      return;
    }

    if (restoreStatus !== 'idle') {
      updatePlannerStage('chat');
      return;
    }

    const plannerCycle = plannerCycleRef.current;
    if (plannerCycle && !plannerCycle.terminalEvent) {
      updatePlannerStage('loading');
      return;
    }

    if (messages.length > 0) {
      updatePlannerStage('chat');
      return;
    }

    updatePlannerStage('entry');
  }, [entryMode, messages.length, restoreStatus, updatePlannerStage]);

  useEffect(() => {
    onPlannerStageChange?.(plannerStage);
  }, [onPlannerStageChange, plannerStage]);

  useEffect(() => {
    const plannerCycle = plannerCycleRef.current;
    if (!plannerCycle || plannerCycle.terminalEvent) {
      return;
    }

    const relevantMessages = messages.slice(plannerCycle.baselineMessageCount);
    if (relevantMessages.length === 0) {
      return;
    }

    let sawSearchAccommodationOutput = false;
    let sawSearchAccommodationError = false;
    const plannerAccommodationIds = new Set<string>();
    let hasAccommodationCards = false;

    for (const message of relevantMessages) {
      for (const part of message.parts) {
        const toolPart = normalizeToolPart(part);
        if (!toolPart || toolPart.toolName !== 'searchAccommodation') {
          continue;
        }

        if (toolPart.state === 'output-error') {
          sawSearchAccommodationError = true;
          continue;
        }

        if (toolPart.state !== 'output-available' || !toolPart.output) {
          continue;
        }

        sawSearchAccommodationOutput = true;
        const data = toolPart.output as SearchAccommodationResult;
        const ids = [
          data.affiliate?.placeId,
          ...data.alternatives.map((accommodation) => accommodation.placeId),
        ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

        for (const placeId of ids) {
          plannerAccommodationIds.add(placeId);
        }

        if (data.affiliate || data.alternatives.length > 0) {
          hasAccommodationCards = true;
        }
      }
    }

    if (hasAccommodationCards) {
      setPlannerTrackedAccommodationIds(Array.from(plannerAccommodationIds));
      trackPlannerEvent({
        eventName: 'planner_result_viewed',
        locale,
      });
      updatePlannerStage('chat');
      plannerCycleRef.current = {
        ...plannerCycle,
        terminalEvent: 'planner_result_viewed',
      };
      return;
    }

    if (error || sawSearchAccommodationError) {
      clearPlannerTrackedAccommodationIds();
      trackPlannerEvent({
        eventName: 'planner_failed',
        locale,
      });
      updatePlannerStage('chat');
      plannerCycleRef.current = {
        ...plannerCycle,
        terminalEvent: 'planner_failed',
      };
      return;
    }

    if (status !== 'ready') {
      return;
    }

    clearPlannerTrackedAccommodationIds();

    if (sawSearchAccommodationOutput) {
      trackPlannerEvent({
        eventName: 'planner_empty_result',
        locale,
      });
      updatePlannerStage('chat');
      plannerCycleRef.current = {
        ...plannerCycle,
        terminalEvent: 'planner_empty_result',
      };
      return;
    }

    trackPlannerEvent({
      eventName: 'planner_failed',
      locale,
    });
    updatePlannerStage('chat');
    plannerCycleRef.current = {
      ...plannerCycle,
      terminalEvent: 'planner_failed',
    };
  }, [error, locale, messages, status, updatePlannerStage]);

  const handlePlannerSubmit = useCallback(
    (query: string): boolean => {
      clearPlannerTrackedAccommodationIds();

      const didSend = handleExampleClick(query);
      if (!didSend) {
        plannerCycleRef.current = null;
        return false;
      }

      plannerCycleRef.current = {
        baselineMessageCount: messages.length,
        terminalEvent: null,
      };
      updatePlannerStage('loading');

      return true;
    },
    [handleExampleClick, messages.length, updatePlannerStage],
  );
  const showStandardChatChrome = entryMode === 'chat' || plannerStage === 'chat';

  return (
    <div className='flex h-full flex-col'>
      {showStandardChatChrome && (
        <ChatPanelHeader
          onNewConversation={handleNewConversation}
          onSaveClick={handleSaveClick}
          onHistoryClick={handleHistoryClick}
        />
      )}

      <ChatPanelRestoreBanner
        restoreStatus={restoreStatus}
        onRetryRestore={() => void handleRetryRestore()}
        onOpenHistory={() => setShowHistory(true)}
      />

      <ChatMessageList
        entryMode={entryMode}
        messages={messages}
        plannerStage={plannerStage}
        status={status}
        scrollAreaRef={scrollAreaRef}
        messagesEndRef={messagesEndRef}
        onPlannerSubmit={handlePlannerSubmit}
      />

      {error && (
        <ChatPanelErrorBanner
          isRateLimitError={isRateLimitError}
          message={userErrorMessage}
          showLoginAction={authStatus !== 'authenticated' && isRateLimitError}
          onLogin={openLoginModalForRateLimit}
          onRetry={() => regenerate({ body: getChatRequestBody() })}
          onDismiss={clearError}
        />
      )}

      {showStandardChatChrome && (
        <div className='border-t border-border/60 bg-background/95 backdrop-blur-md p-4 md:p-5 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]'>
          <ChatInput
            input={input}
            isLoading={isLoading}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            onStop={stop}
          />
        </div>
      )}

      <HistorySidebar
        open={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
    </div>
  );
}

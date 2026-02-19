'use client';

import { useChat } from '@ai-sdk/react';
import { useSession } from 'next-auth/react';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { ChatPanelHeader } from '@/components/chat/ChatPanelHeader';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessageList } from '@/components/chat/ChatMessageList';
import { ChatPanelErrorBanner, ChatPanelRestoreBanner } from '@/components/chat/ChatPanelSections';
import { extractMapEntitiesFromMessages, isRateLimitErrorMessage } from '@/components/chat/chatPanelUtils';
import { HistorySidebar } from '@/components/history/HistorySidebar';
import { LoginPromptModal } from '@/components/modals/LoginPromptModal';
import { useChatViewport } from '@/hooks/useChatViewport';
import { useChatLoginGate } from '@/hooks/useChatLoginGate';
import { useConversationRestore } from '@/hooks/useConversationRestore';
import { useGuestSession } from '@/hooks/useGuestSession';
import { useRateLimitLoginPrompt } from '@/hooks/useRateLimitLoginPrompt';
import { useSessionMerge } from '@/hooks/useSessionMerge';
import { isRestoreAutoEnabled } from '@/lib/featureFlags';
import type { MapEntity, PlaceEntity } from '@/lib/types';

interface ChatPanelProps {
  onEntitiesUpdate: (entities: MapEntity[]) => void;
  onPlaceSelect: (place: PlaceEntity) => void;
  onPlaceHover?: (placeId: string | undefined) => void;
  selectedPlaceId?: string;
  mapHoveredEntityId?: string;
}

const EXAMPLE_QUERIES = [
  '파리 에펠탑 근처, 취소분이 자주 나오는 가성비 숙소 찾아줘.',
  '런던에서 지금 당장 예약 가능한 4성급 호텔 리스트 보여줘.',
  '특정 숙소의 빈 방 알림을 설정하고 싶어.',
];

export function ChatPanel({
  onEntitiesUpdate,
  onPlaceSelect,
  onPlaceHover,
  selectedPlaceId,
  mapHoveredEntityId,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const { sessionId } = useGuestSession();
  const { mergeStatus } = useSessionMerge();
  const { status: authStatus } = useSession();
  const restoreAutoEnabled = isRestoreAutoEnabled();

  const { messages, sendMessage, status, stop, error, regenerate, clearError, setMessages } = useChat();

  const { currentConversationId, restoreStatus, handleNewConversation, handleRetryRestore, handleSelectConversation } =
    useConversationRestore({
      mergeStatus,
      messages,
      onEntitiesUpdate,
      restoreAutoEnabled,
      setMessages,
    });

  const {
    showLoginModal,
    loginModalTrigger,
    closeLoginModal,
    openLoginModalForRateLimit,
    handleAlertClick,
    handleHistoryClick,
    handleSaveClick,
  } = useChatLoginGate({
    authStatus,
    messagesCount: messages.length,
    onOpenHistory: () => setShowHistory(true),
  });

  const getChatRequestBody = useCallback(
    () => ({
      sessionId: sessionId ?? undefined,
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

  const isLoading = status !== 'ready';
  const errorMessage = typeof error?.message === 'string' ? error.message : null;
  const isRateLimitError = errorMessage != null && isRateLimitErrorMessage(errorMessage);

  useRateLimitLoginPrompt({
    authStatus,
    errorMessage,
    isRateLimitError,
    onPromptLogin: openLoginModalForRateLimit,
  });

  const { messagesEndRef, scrollAreaRef } = useChatViewport({
    messagesLength: messages.length,
    selectedPlaceId,
  });

  useEffect(() => {
    onEntitiesUpdate(extractMapEntitiesFromMessages(messages));
  }, [messages, onEntitiesUpdate]);

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
    [ensureSessionReady, getChatRequestBody, input, isLoading, sendMessage],
  );

  const handleExampleClick = useCallback(
    (query: string) => {
      if (!ensureSessionReady()) {
        return;
      }

      setInput('');
      sendMessage({ text: query }, { body: getChatRequestBody() });
    },
    [ensureSessionReady, getChatRequestBody, sendMessage],
  );

  return (
    <div className='flex h-full flex-col'>
      <ChatPanelHeader
        onNewConversation={handleNewConversation}
        onSaveClick={handleSaveClick}
        onHistoryClick={handleHistoryClick}
      />

      <ChatPanelRestoreBanner
        restoreStatus={restoreStatus}
        onRetryRestore={() => void handleRetryRestore()}
        onOpenHistory={() => setShowHistory(true)}
      />

      <ChatMessageList
        messages={messages}
        status={status}
        exampleQueries={EXAMPLE_QUERIES}
        scrollAreaRef={scrollAreaRef}
        messagesEndRef={messagesEndRef}
        currentConversationId={currentConversationId}
        sessionId={sessionId ?? undefined}
        onExampleClick={handleExampleClick}
        onPlaceSelect={onPlaceSelect}
        onPlaceHover={onPlaceHover}
        onAlertClick={handleAlertClick}
        selectedPlaceId={selectedPlaceId}
        mapHoveredEntityId={mapHoveredEntityId}
      />

      {error && (
        <ChatPanelErrorBanner
          isRateLimitError={isRateLimitError}
          showLoginAction={authStatus !== 'authenticated' && isRateLimitError}
          onLogin={openLoginModalForRateLimit}
          onRetry={() => regenerate({ body: getChatRequestBody() })}
          onDismiss={clearError}
        />
      )}

      <div className='border-t border-border/60 bg-background/95 backdrop-blur-md p-4 md:p-5 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]'>
        <ChatInput input={input} isLoading={isLoading} onInputChange={setInput} onSubmit={handleSubmit} onStop={stop} />
      </div>

      <LoginPromptModal open={showLoginModal} onClose={closeLoginModal} trigger={loginModalTrigger} />
      <HistorySidebar
        open={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
    </div>
  );
}

'use client';

import { useChat } from '@ai-sdk/react';
import { Bot, History, Save } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatPanelEmptyState, ChatPanelErrorBanner, ChatPanelRestoreBanner } from '@/components/chat/ChatPanelSections';
import {
  createConversationId,
  extractMapEntitiesFromMessages,
  getUserMessagePreview,
  isRateLimitErrorMessage,
  LAST_CONVERSATION_ID_STORAGE_KEY,
  mapConversationEntitiesToMapEntities,
  mapConversationMessagesToUiMessages,
  parsePendingRestoreSnapshot,
  PENDING_RESTORE_STALE_MS,
  PENDING_RESTORE_STORAGE_KEY,
  type ConversationSummary,
  type PendingRestoreSnapshot,
} from '@/components/chat/chatPanelUtils';
import { HistorySidebar } from '@/components/history/HistorySidebar';
import { LoginPromptModal } from '@/components/modals/LoginPromptModal';
import { useGuestSession } from '@/hooks/useGuestSession';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const rateLimitModalShownForErrorRef = useRef<string | null>(null);
  const hasAutoRestoredConversationRef = useRef(false);
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'restoring' | 'failed'>('idle');
  const [restoreTargetConversationId, setRestoreTargetConversationId] = useState<string | null>(null);
  const [restorePreview, setRestorePreview] = useState('');
  const restoreAutoEnabled = isRestoreAutoEnabled();
  const [loginModalTrigger, setLoginModalTrigger] = useState<'save' | 'history' | 'bookmark' | 'limit'>('save');
  const [currentConversationId, setCurrentConversationId] = useState<string>(() => createConversationId());

  const { sessionId } = useGuestSession();
  const { mergeStatus } = useSessionMerge();
  const { status: authStatus } = useSession();

  const { messages, sendMessage, status, stop, error, regenerate, clearError, setMessages } = useChat();

  const getChatRequestBody = useCallback(
    () => ({
      sessionId: sessionId ?? undefined,
      conversationId: currentConversationId,
    }),
    [sessionId, currentConversationId],
  );

  const clearRestoreState = useCallback(() => {
    setRestoreStatus('idle');
    setRestoreTargetConversationId(null);
    setRestorePreview('');
  }, []);

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

  useEffect(() => {
    if (!errorMessage) {
      rateLimitModalShownForErrorRef.current = null;
      return;
    }

    const shouldPromptLogin = authStatus !== 'authenticated' && isRateLimitErrorMessage(errorMessage);

    if (!shouldPromptLogin) {
      return;
    }

    if (rateLimitModalShownForErrorRef.current === errorMessage) {
      return;
    }

    setLoginModalTrigger('limit');
    setShowLoginModal(true);
    rateLimitModalShownForErrorRef.current = errorMessage;
  }, [authStatus, errorMessage]);

  useEffect(() => {
    onEntitiesUpdate(extractMapEntitiesFromMessages(messages));
  }, [messages, onEntitiesUpdate]);

  const messagesLength = messages.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally scroll on message count change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesLength]);

  useEffect(() => {
    if (!selectedPlaceId || !scrollAreaRef.current) return;
    const el = scrollAreaRef.current.querySelector(`[data-place-id="${selectedPlaceId}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedPlaceId]);

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault?.();
      if (!input.trim() || isLoading) return;
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

  const handleAlertClick = useCallback(
    (_place: PlaceEntity) => {
      if (authStatus === 'authenticated') {
        toast.info('빈방 알림 기능은 준비 중이에요.');
        return;
      }

      setLoginModalTrigger('bookmark');
      setShowLoginModal(true);
    },
    [authStatus],
  );

  const handleSaveClick = useCallback(() => {
    if (messages.length === 0) {
      toast.info('저장할 대화가 아직 없어요.');
      return;
    }

    if (authStatus === 'authenticated') {
      // 대화는 매 턴마다 자동 저장됨 — 히스토리 사이드바에서 확인 가능
      setShowHistory(true);
    } else {
      setLoginModalTrigger('save');
      setShowLoginModal(true);
    }
  }, [authStatus, messages.length]);

  const handleHistoryClick = useCallback(() => {
    if (authStatus === 'authenticated') {
      setShowHistory(true);
    } else {
      setLoginModalTrigger('history');
      setShowLoginModal(true);
    }
  }, [authStatus]);

  const loadConversation = useCallback(
    async (conversationId: string, options?: { silent?: boolean; retryCount?: number }) => {
      const retryCount = options?.retryCount ?? 0;

      try {
        let response: Response | null = null;

        for (let attempt = 0; attempt <= retryCount; attempt += 1) {
          response = await fetch(`/api/conversations/${conversationId}`);
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
          throw new Error('Failed to load conversation');
        }

        const data = (await response.json()) as {
          conversation: {
            id: string;
            messages: Array<{ role: string; content: string }>;
            entities: Array<{
              id: string;
              type: string;
              name: string;
              latitude: number;
              longitude: number;
              metadata: unknown;
            }>;
          };
        };

        setMessages(mapConversationMessagesToUiMessages(data.conversation.messages));
        setCurrentConversationId(conversationId);
        localStorage.setItem(LAST_CONVERSATION_ID_STORAGE_KEY, conversationId);

        onEntitiesUpdate(mapConversationEntitiesToMapEntities(data.conversation.entities));

        if (!options?.silent) {
          toast.success('대화를 불러왔습니다');
        }
        return true;
      } catch (err) {
        console.error('Failed to load conversation:', err);
        if (!options?.silent) {
          toast.error('대화를 불러오지 못했습니다');
        }
        return false;
      }
    },
    [setMessages, onEntitiesUpdate],
  );

  const handleSelectConversation = useCallback(
    async (conversationId: string) => {
      const restored = await loadConversation(conversationId);
      if (restored) {
        clearRestoreState();
      }
    },
    [clearRestoreState, loadConversation],
  );

  const findFallbackConversationId = useCallback(async (preview: string, excludeId: string): Promise<string | null> => {
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
  }, []);

  const restoreConversationWithFallback = useCallback(
    async (targetConversationId: string, preview: string): Promise<boolean> => {
      setRestoreStatus('restoring');

      // merge 완료 후 트리거되므로 retry 1회로 충분하다 (네트워크 일시 오류 대비)
      const restoredPrimary = await loadConversation(targetConversationId, { silent: true, retryCount: 1 });
      if (restoredPrimary) {
        clearRestoreState();
        toast.success('이전 대화를 복원했어요.');
        return true;
      }

      const fallbackConversationId = await findFallbackConversationId(preview, targetConversationId);
      if (fallbackConversationId) {
        const restoredFallback = await loadConversation(fallbackConversationId, { silent: true, retryCount: 1 });
        if (restoredFallback) {
          clearRestoreState();
          toast.success('최근 대화로 복원했어요.');
          return true;
        }
      }

      setRestoreStatus('failed');
      setRestoreTargetConversationId(targetConversationId);
      setRestorePreview(preview);
      toast.error('대화를 자동 복원하지 못했어요.');
      return false;
    },
    [clearRestoreState, findFallbackConversationId, loadConversation],
  );

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }
    const snapshot: PendingRestoreSnapshot = {
      conversationId: currentConversationId,
      updatedAt: Date.now(),
      preview: getUserMessagePreview(messages),
    };

    localStorage.setItem(LAST_CONVERSATION_ID_STORAGE_KEY, currentConversationId);
    localStorage.setItem(PENDING_RESTORE_STORAGE_KEY, JSON.stringify(snapshot));
  }, [messages, currentConversationId]);

  // merge 완료(done) 이후에 restore를 트리거한다.
  // authStatus 기반이 아니라 mergeStatus 기반으로 순서를 보장하여,
  // merge DB write 이전에 GET /api/conversations/:id 가 실행되는 race condition을 제거한다.
  useEffect(() => {
    if (!restoreAutoEnabled) {
      return;
    }

    if (mergeStatus !== 'done' || hasAutoRestoredConversationRef.current) {
      return;
    }

    hasAutoRestoredConversationRef.current = true;
    if (messages.length > 0) {
      return;
    }

    let pendingSnapshot = parsePendingRestoreSnapshot(localStorage.getItem(PENDING_RESTORE_STORAGE_KEY));
    const now = Date.now();
    if (
      pendingSnapshot &&
      typeof pendingSnapshot.updatedAt === 'number' &&
      now - pendingSnapshot.updatedAt > PENDING_RESTORE_STALE_MS
    ) {
      localStorage.removeItem(PENDING_RESTORE_STORAGE_KEY);
      pendingSnapshot = null;
    }

    const storedConversationId = localStorage.getItem(LAST_CONVERSATION_ID_STORAGE_KEY);
    const targetConversationId = pendingSnapshot?.conversationId ?? storedConversationId;

    if (!targetConversationId) {
      return;
    }

    setRestorePreview(pendingSnapshot?.preview ?? '');
    localStorage.removeItem(PENDING_RESTORE_STORAGE_KEY);
    localStorage.removeItem(LAST_CONVERSATION_ID_STORAGE_KEY);
    setRestoreTargetConversationId(targetConversationId);
    void restoreConversationWithFallback(targetConversationId, pendingSnapshot?.preview ?? '');
  }, [mergeStatus, messages.length, restoreAutoEnabled, restoreConversationWithFallback]);

  const handleRetryRestore = useCallback(async () => {
    if (!restoreTargetConversationId) {
      return;
    }

    await restoreConversationWithFallback(restoreTargetConversationId, restorePreview);
  }, [restoreConversationWithFallback, restorePreview, restoreTargetConversationId]);

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(createConversationId());
    clearRestoreState();
    localStorage.removeItem(PENDING_RESTORE_STORAGE_KEY);
    localStorage.removeItem(LAST_CONVERSATION_ID_STORAGE_KEY);
    onEntitiesUpdate([]);
  }, [clearRestoreState, setMessages, onEntitiesUpdate]);

  return (
    <div className='flex h-full flex-col'>
      {/* Header: mindtrip-style minimal actions */}
      <div className='flex items-center justify-between border-b border-border/60 bg-transparent px-4 py-3'>
        <button
          type='button'
          onClick={handleNewConversation}
          className='text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground rounded-full px-3 py-2 -ml-2'
          aria-label='새 대화 시작'
        >
          새 대화
        </button>
        <div className='flex items-center gap-0.5'>
          <button
            type='button'
            onClick={handleSaveClick}
            className='p-2 rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground'
            aria-label='대화 저장'
            title='대화 저장'
          >
            <Save className='h-4 w-4' />
          </button>
          <button
            type='button'
            onClick={handleHistoryClick}
            className='p-2 rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground'
            aria-label='대화 히스토리'
            title='대화 히스토리'
          >
            <History className='h-4 w-4' />
          </button>
        </div>
      </div>

      <ChatPanelRestoreBanner
        restoreStatus={restoreStatus}
        onRetryRestore={() => void handleRetryRestore()}
        onOpenHistory={() => setShowHistory(true)}
      />

      <div ref={scrollAreaRef} className='flex-1 overflow-y-auto scrollbar-hide px-4 md:px-5 py-5'>
        {messages.length === 0 ? (
          <ChatPanelEmptyState queries={EXAMPLE_QUERIES} onExampleClick={handleExampleClick} />
        ) : (
          <div className='flex flex-col gap-0'>
            {messages.map((message, idx) => {
              const isLast = idx === messages.length - 1;
              const isStreamingAssistant = status === 'streaming' && isLast && message.role === 'assistant';
              return (
                <div
                  key={message.id}
                  className='message-block first:pt-0 first:mt-0 last:pb-4 last:mb-0 last:border-b-0'
                >
                  <ChatMessage
                    message={message}
                    onPlaceSelect={onPlaceSelect}
                    onPlaceHover={onPlaceHover}
                    onAlertClick={handleAlertClick}
                    selectedPlaceId={selectedPlaceId}
                    mapHoveredEntityId={mapHoveredEntityId}
                    isStreaming={isStreamingAssistant}
                    conversationId={currentConversationId}
                    sessionId={sessionId ?? undefined}
                  />
                </div>
              );
            })}
            {status === 'streaming' && (messages.length === 0 || messages[messages.length - 1]?.role === 'user') && (
              <div className='message-block flex gap-3 first:pt-0 first:mt-0' aria-live='polite' aria-busy='true'>
                <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted/80 text-muted-foreground ring-1 ring-border/40'>
                  <Bot className='h-4 w-4' aria-hidden />
                </div>
                <div className='flex flex-1 items-center gap-1.5 rounded-2xl bg-muted/30 px-4 py-3 w-fit'>
                  <span className='h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]' />
                  <span className='h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]' />
                  <span className='h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]' />
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {error && (
        <ChatPanelErrorBanner
          isRateLimitError={isRateLimitError}
          showLoginAction={authStatus !== 'authenticated' && isRateLimitError}
          onLogin={() => {
            setLoginModalTrigger('limit');
            setShowLoginModal(true);
          }}
          onRetry={() => regenerate({ body: getChatRequestBody() })}
          onDismiss={clearError}
        />
      )}
      <div className='border-t border-border/60 bg-background/95 backdrop-blur-md p-4 md:p-5 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]'>
        <ChatInput input={input} isLoading={isLoading} onInputChange={setInput} onSubmit={handleSubmit} onStop={stop} />
      </div>

      {/* Modals and Sidebars */}
      <LoginPromptModal open={showLoginModal} onClose={() => setShowLoginModal(false)} trigger={loginModalTrigger} />
      <HistorySidebar
        open={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
    </div>
  );
}

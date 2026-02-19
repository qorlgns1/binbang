'use client';

import type { UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { Bot, History, Landmark, RefreshCw, Save } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage } from '@/components/chat/ChatMessage';
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
}

const EXAMPLE_QUERIES = [
  '파리 에펠탑 근처, 취소분이 자주 나오는 가성비 숙소 찾아줘.',
  '런던에서 지금 당장 예약 가능한 4성급 호텔 리스트 보여줘.',
  '특정 숙소의 빈 방 알림을 설정하고 싶어.',
];
const LAST_CONVERSATION_ID_STORAGE_KEY = 'travel_last_conversation_id';
const PENDING_RESTORE_STORAGE_KEY = 'travel_pending_restore';

interface PendingRestoreSnapshot {
  conversationId: string;
  updatedAt: number;
  preview: string;
}

interface ConversationSummary {
  id: string;
}

function createConversationId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function parsePendingRestoreSnapshot(value: string | null): PendingRestoreSnapshot | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<PendingRestoreSnapshot>;
    const conversationId = typeof parsed.conversationId === 'string' ? parsed.conversationId.trim() : '';

    if (!conversationId) {
      return null;
    }

    return {
      conversationId,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
      preview: typeof parsed.preview === 'string' ? parsed.preview : '',
    };
  } catch {
    return null;
  }
}

function getUserMessagePreview(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.role !== 'user') {
      continue;
    }

    const preview = message.parts
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
      .map((part) => part.text)
      .join('')
      .trim();

    if (preview) {
      return preview.slice(0, 80);
    }
  }

  return '';
}

export function ChatPanel({ onEntitiesUpdate, onPlaceSelect, onPlaceHover, selectedPlaceId }: ChatPanelProps) {
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

  const isLoading = status !== 'ready';
  const isRateLimitError =
    typeof error?.message === 'string' &&
    (error.message.includes('429') || /rate\s*limit|too\s*many/i.test(error.message));

  useEffect(() => {
    const errorMessage = typeof error?.message === 'string' ? error.message : null;

    if (!errorMessage) {
      rateLimitModalShownForErrorRef.current = null;
      return;
    }

    const shouldPromptLogin =
      authStatus !== 'authenticated' && (errorMessage.includes('429') || /rate\s*limit|too\s*many/i.test(errorMessage));

    if (!shouldPromptLogin) {
      return;
    }

    if (rateLimitModalShownForErrorRef.current === errorMessage) {
      return;
    }

    setLoginModalTrigger('limit');
    setShowLoginModal(true);
    rateLimitModalShownForErrorRef.current = errorMessage;
  }, [authStatus, error]);

  const extractEntities = useCallback(
    (msgs: UIMessage[]) => {
      const entities: MapEntity[] = [];
      for (const msg of msgs) {
        for (const part of msg.parts) {
          const partAny = part as unknown as { type: string; state?: string; output?: unknown; toolName?: string };
          if (!partAny.type.startsWith('tool-') && partAny.type !== 'dynamic-tool') continue;
          if (partAny.state !== 'output-available') continue;

          let toolName: string;
          if (partAny.type === 'dynamic-tool') {
            toolName = partAny.toolName ?? '';
          } else {
            toolName = partAny.type.slice(5);
          }

          if (toolName === 'searchPlaces' && partAny.output) {
            const data = partAny.output as { places: PlaceEntity[] };
            if (data.places) {
              for (const place of data.places) {
                if (place.latitude != null && place.longitude != null) {
                  entities.push({
                    id: place.placeId,
                    name: place.name,
                    latitude: place.latitude,
                    longitude: place.longitude,
                    type: inferType(place.types),
                    photoUrl: place.photoUrl,
                  });
                }
              }
            }
          }
        }
      }
      onEntitiesUpdate(entities);
    },
    [onEntitiesUpdate],
  );

  useEffect(() => {
    extractEntities(messages);
  }, [messages, extractEntities]);

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
      if (authStatus !== 'authenticated' && sessionId == null) {
        toast.info('세션 준비 중입니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
      const text = input.trim();
      setInput('');
      sendMessage({ text }, { body: getChatRequestBody() });
    },
    [authStatus, getChatRequestBody, input, isLoading, sendMessage, sessionId],
  );

  const handleExampleClick = useCallback(
    (query: string) => {
      if (authStatus !== 'authenticated' && sessionId == null) {
        toast.info('세션 준비 중입니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
      setInput('');
      sendMessage({ text: query }, { body: getChatRequestBody() });
    },
    [authStatus, getChatRequestBody, sendMessage, sessionId],
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

        // Convert messages to UIMessage format
        const uiMessages: UIMessage[] = data.conversation.messages.map((msg) => ({
          id: createConversationId(),
          role: msg.role as 'user' | 'assistant',
          parts: [{ type: 'text' as const, text: msg.content }],
        }));

        setMessages(uiMessages);
        setCurrentConversationId(conversationId);
        localStorage.setItem(LAST_CONVERSATION_ID_STORAGE_KEY, conversationId);

        // Extract and update entities
        const mapEntities: MapEntity[] = data.conversation.entities
          .filter((e) => e.latitude != null && e.longitude != null)
          .map((e) => ({
            id: e.id,
            name: e.name,
            latitude: e.latitude,
            longitude: e.longitude,
            type: e.type as MapEntity['type'],
            photoUrl: (e.metadata as { photoUrl?: string })?.photoUrl,
          }));

        onEntitiesUpdate(mapEntities);

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
        setRestoreStatus('idle');
        setRestoreTargetConversationId(null);
        setRestorePreview('');
      }
    },
    [loadConversation],
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
        setRestoreStatus('idle');
        setRestoreTargetConversationId(null);
        setRestorePreview('');
        toast.success('이전 대화를 복원했어요.');
        return true;
      }

      const fallbackConversationId = await findFallbackConversationId(preview, targetConversationId);
      if (fallbackConversationId) {
        const restoredFallback = await loadConversation(fallbackConversationId, { silent: true, retryCount: 1 });
        if (restoredFallback) {
          setRestoreStatus('idle');
          setRestoreTargetConversationId(null);
          setRestorePreview('');
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
    [findFallbackConversationId, loadConversation],
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

    const pendingSnapshot = parsePendingRestoreSnapshot(localStorage.getItem(PENDING_RESTORE_STORAGE_KEY));
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
    setRestoreStatus('idle');
    setRestoreTargetConversationId(null);
    setRestorePreview('');
    localStorage.removeItem(PENDING_RESTORE_STORAGE_KEY);
    localStorage.removeItem(LAST_CONVERSATION_ID_STORAGE_KEY);
    onEntitiesUpdate([]);
  }, [setMessages, onEntitiesUpdate]);

  return (
    <div className='flex h-full flex-col'>
      {/* Header with actions */}
      <div className='border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={handleNewConversation}
            className='text-sm text-muted-foreground hover:text-foreground transition-colors'
            aria-label='새 대화 시작'
          >
            새 대화
          </button>
        </div>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={handleSaveClick}
            className='p-2 rounded-lg hover:bg-muted transition-colors'
            aria-label='대화 저장'
            title='대화 저장'
          >
            <Save className='h-4 w-4' />
          </button>
          <button
            type='button'
            onClick={handleHistoryClick}
            className='p-2 rounded-lg hover:bg-muted transition-colors'
            aria-label='대화 히스토리'
            title='대화 히스토리'
          >
            <History className='h-4 w-4' />
          </button>
        </div>
      </div>

      {restoreStatus === 'restoring' && (
        <div className='border-b border-border bg-primary/10 px-4 py-2.5 flex items-center gap-2 text-sm text-foreground'>
          <RefreshCw className='h-4 w-4 animate-spin text-primary' aria-hidden />
          <span>이전 대화를 복원하는 중...</span>
        </div>
      )}

      {restoreStatus === 'failed' && (
        <div className='border-b border-border bg-destructive/10 px-4 py-2.5 flex items-center justify-between gap-3'>
          <p className='text-sm text-destructive font-medium'>대화를 자동 복원하지 못했어요.</p>
          <div className='flex items-center gap-2 shrink-0'>
            <button
              type='button'
              onClick={() => void handleRetryRestore()}
              className='inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors'
              aria-label='대화 복원 다시 시도'
            >
              다시 시도
            </button>
            <button
              type='button'
              onClick={() => setShowHistory(true)}
              className='inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors'
              aria-label='대화 히스토리 열기'
            >
              히스토리 열기
            </button>
          </div>
        </div>
      )}

      <div ref={scrollAreaRef} className='flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-6'>
        {messages.length === 0 ? (
          <div className='flex flex-col items-center justify-center min-h-[60vh] text-center px-4'>
            <div className='flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-amber-light dark:bg-brand-amber-dark/30 mb-6 ring-2 ring-brand-amber/20 dark:ring-brand-amber/50'>
              <Landmark className='h-10 w-10 text-brand-amber dark:text-brand-amber' aria-hidden />
            </div>
            <h2 className='text-2xl font-bold mb-2 text-foreground'>빈방</h2>
            <p className='text-muted-foreground mb-8 max-w-md leading-loose text-[0.9375rem] sm:text-base'>
              반가워요. 당신의 휴식이 길을 잃지 않도록, 빈방이 밤새 불을 밝혀둘게요.
            </p>
            <p className='text-xs text-muted-foreground mb-3'>추천 질문</p>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg'>
              {EXAMPLE_QUERIES.map((query) => (
                <button
                  key={query}
                  type='button'
                  onClick={() => handleExampleClick(query)}
                  className='rounded-xl border border-border bg-card px-4 py-3 text-left text-sm hover:bg-accent hover:border-brand-amber/50 active:scale-[0.98] transition-all duration-150 shadow-sm hover:shadow-md'
                  aria-label={`추천 질문: ${query}`}
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className='space-y-0'>
            {messages.map((message, idx) => {
              const isLast = idx === messages.length - 1;
              const isStreamingAssistant = status === 'streaming' && isLast && message.role === 'assistant';
              return (
                <div key={message.id} className='py-4 border-b border-border/40 last:border-0 last:pb-2'>
                  <ChatMessage
                    message={message}
                    onPlaceSelect={onPlaceSelect}
                    onPlaceHover={onPlaceHover}
                    onAlertClick={handleAlertClick}
                    selectedPlaceId={selectedPlaceId}
                    isStreaming={isStreamingAssistant}
                    conversationId={currentConversationId}
                    sessionId={sessionId ?? undefined}
                  />
                </div>
              );
            })}
            {status === 'streaming' && (messages.length === 0 || messages[messages.length - 1]?.role === 'user') && (
              <div className='flex gap-3 py-4' aria-live='polite' aria-busy='true'>
                <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border/50'>
                  <Bot className='h-4 w-4' aria-hidden />
                </div>
                <div className='flex flex-1 items-center gap-1 rounded-2xl rounded-tl-sm bg-muted/50 dark:bg-muted/30 border border-border/50 px-4 py-3 w-fit'>
                  <span className='h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]' />
                  <span className='h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]' />
                  <span className='h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]' />
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {error && (
        <div className='border-t border-border bg-destructive/10 px-4 py-3 flex items-center justify-between gap-3'>
          <p className='text-sm text-destructive font-medium flex-1'>
            {isRateLimitError
              ? '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.'
              : '답변을 불러오지 못했어요. 네트워크를 확인한 뒤 다시 시도해 주세요.'}
          </p>
          <div className='flex items-center gap-2 shrink-0'>
            {authStatus !== 'authenticated' && isRateLimitError && (
              <button
                type='button'
                onClick={() => {
                  setLoginModalTrigger('limit');
                  setShowLoginModal(true);
                }}
                className='inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors'
                aria-label='로그인해서 계속 사용하기'
              >
                로그인
              </button>
            )}
            <button
              type='button'
              onClick={() => regenerate({ body: getChatRequestBody() })}
              className='inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all duration-150'
              aria-label='마지막 메시지 다시 생성'
            >
              <RefreshCw className='h-4 w-4' aria-hidden />
              다시 시도
            </button>
            <button
              type='button'
              onClick={() => clearError()}
              className='text-sm text-muted-foreground hover:text-foreground transition-colors'
              aria-label='에러 메시지 닫기'
            >
              닫기
            </button>
          </div>
        </div>
      )}
      <div className='border-t border-border bg-background/80 backdrop-blur-sm p-4 pb-keyboard'>
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

function inferType(types: string[]): MapEntity['type'] {
  if (types.includes('lodging') || types.includes('hotel')) return 'accommodation';
  if (types.includes('restaurant') || types.includes('food')) return 'restaurant';
  if (types.includes('tourist_attraction') || types.includes('museum')) return 'attraction';
  return 'place';
}

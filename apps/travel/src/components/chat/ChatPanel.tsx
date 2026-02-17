'use client';

import type { UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { Bot, History, Landmark, RefreshCw, Save } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { HistorySidebar } from '@/components/history/HistorySidebar';
import { LoginPromptModal } from '@/components/modals/LoginPromptModal';
import { useGuestSession } from '@/hooks/useGuestSession';
import { useSessionMerge } from '@/hooks/useSessionMerge';
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

export function ChatPanel({ onEntitiesUpdate, onPlaceSelect, onPlaceHover, selectedPlaceId }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalTrigger, setLoginModalTrigger] = useState<'save' | 'history' | 'bookmark'>('save');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const { sessionId } = useGuestSession();
  useSessionMerge();
  const { status: authStatus } = useSession();

  const { messages, sendMessage, status, stop, error, regenerate, clearError, setMessages } = useChat({
    body: { sessionId, conversationId: currentConversationId },
  } as Parameters<typeof useChat>[0]);

  const isLoading = status !== 'ready';

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
    (e?: React.FormEvent) => {
      e?.preventDefault?.();
      if (!input.trim() || isLoading) return;
      const text = input.trim();
      setInput('');
      sendMessage({ text });
    },
    [input, isLoading, sendMessage],
  );

  const handleExampleClick = (query: string) => {
    setInput('');
    sendMessage({ text: query });
  };

  const handleAlertClick = useCallback((_place: PlaceEntity) => {
    toast.info('빈방 알림 기능은 준비 중이에요.');
  }, []);

  const handleSaveClick = useCallback(() => {
    if (authStatus === 'authenticated') {
      toast.success('대화가 저장되었습니다');
    } else {
      setLoginModalTrigger('save');
      setShowLoginModal(true);
    }
  }, [authStatus]);

  const handleHistoryClick = useCallback(() => {
    if (authStatus === 'authenticated') {
      setShowHistory(true);
    } else {
      setLoginModalTrigger('history');
      setShowLoginModal(true);
    }
  }, [authStatus]);

  const handleSelectConversation = useCallback(
    async (conversationId: string) => {
      try {
        const res = await fetch(`/api/conversations/${conversationId}`);
        if (!res.ok) throw new Error('Failed to load conversation');

        const data = (await res.json()) as {
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
          id: crypto.randomUUID(),
          role: msg.role as 'user' | 'assistant',
          parts: [{ type: 'text' as const, text: msg.content }],
        }));

        setMessages(uiMessages);
        setCurrentConversationId(conversationId);

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
        toast.success('대화를 불러왔습니다');
      } catch (err) {
        console.error('Failed to load conversation:', err);
        toast.error('대화를 불러오지 못했습니다');
      }
    },
    [setMessages, onEntitiesUpdate],
  );

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    onEntitiesUpdate([]);
  }, [setMessages, onEntitiesUpdate]);

  return (
    <div className='flex h-full flex-col'>
      {/* Header with actions */}
      {messages.length > 0 && (
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
            {typeof error?.message === 'string' &&
            (error.message.includes('429') || /rate\s*limit|too\s*many/i.test(error.message))
              ? '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.'
              : '답변을 불러오지 못했어요. 네트워크를 확인한 뒤 다시 시도해 주세요.'}
          </p>
          <div className='flex items-center gap-2 shrink-0'>
            <button
              type='button'
              onClick={() => regenerate()}
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

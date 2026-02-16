'use client';

import type { UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { Landmark } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage } from '@/components/chat/ChatMessage';
import type { MapEntity, PlaceEntity } from '@/lib/types';

interface ChatPanelProps {
  onEntitiesUpdate: (entities: MapEntity[]) => void;
  onPlaceSelect: (place: PlaceEntity) => void;
  selectedPlaceId?: string;
}

const EXAMPLE_QUERIES = [
  '파리 에펠탑 근처, 취소분이 자주 나오는 가성비 숙소 찾아줘.',
  '런던에서 지금 당장 예약 가능한 4성급 호텔 리스트 보여줘.',
  '특정 숙소의 빈 방 알림을 설정하고 싶어.',
];

export function ChatPanel({ onEntitiesUpdate, onPlaceSelect, selectedPlaceId }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  const { messages, sendMessage, status, stop } = useChat();

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
                if (place.latitude && place.longitude) {
                  entities.push({
                    id: place.placeId,
                    name: place.name,
                    latitude: place.latitude,
                    longitude: place.longitude,
                    type: inferType(place.types),
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

  return (
    <div className='flex h-full flex-col'>
      <div className='flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-6'>
        {messages.length === 0 ? (
          <div className='flex flex-col items-center justify-center min-h-[60vh] text-center px-4'>
            <div className='flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30 mb-6 ring-2 ring-amber-200 dark:ring-amber-800/50'>
              <Landmark className='h-10 w-10 text-amber-600 dark:text-amber-400' aria-hidden />
            </div>
            <h2 className='text-2xl font-bold mb-2 text-foreground'>빈방</h2>
            <p className='text-muted-foreground mb-8 max-w-md leading-relaxed'>
              반가워요. 당신의 휴식이 길을 잃지 않도록, 빈방이 밤새 불을 밝혀둘게요.
            </p>
            <p className='text-xs text-muted-foreground mb-3'>추천 질문</p>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg'>
              {EXAMPLE_QUERIES.map((query) => (
                <button
                  key={query}
                  type='button'
                  onClick={() => handleExampleClick(query)}
                  className='rounded-xl border border-border bg-card px-4 py-3 text-left text-sm hover:bg-accent hover:border-amber-400/50 dark:hover:border-amber-500/50 transition-colors shadow-sm'
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onPlaceSelect={onPlaceSelect}
              onAlertClick={handleAlertClick}
              selectedPlaceId={selectedPlaceId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className='border-t border-border bg-background/80 backdrop-blur-sm p-4'>
        <ChatInput input={input} isLoading={isLoading} onInputChange={setInput} onSubmit={handleSubmit} onStop={stop} />
      </div>
    </div>
  );
}

function inferType(types: string[]): MapEntity['type'] {
  if (types.includes('restaurant') || types.includes('food')) return 'restaurant';
  if (types.includes('lodging') || types.includes('hotel')) return 'accommodation';
  if (types.includes('tourist_attraction') || types.includes('museum')) return 'attraction';
  return 'place';
}

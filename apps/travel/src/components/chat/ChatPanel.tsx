'use client';

import type { UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { Compass } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage } from '@/components/chat/ChatMessage';
import type { MapEntity, PlaceEntity } from '@/lib/types';

interface ChatPanelProps {
  onEntitiesUpdate: (entities: MapEntity[]) => void;
  onPlaceSelect: (place: PlaceEntity) => void;
  selectedPlaceId?: string;
}

const EXAMPLE_QUERIES = [
  'Plan a 5-day trip to Tokyo in spring',
  'Best beaches in Southeast Asia for December',
  'Budget-friendly European cities for a week',
  "What's the weather like in Bali in March?",
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

  return (
    <div className='flex h-full flex-col'>
      <div className='flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-6'>
        {messages.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full text-center px-4'>
            <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-6'>
              <Compass className='h-8 w-8 text-primary' />
            </div>
            <h2 className='text-2xl font-bold mb-2'>AI Travel Planner</h2>
            <p className='text-muted-foreground mb-8 max-w-md'>
              Tell me where you want to go, and I&apos;ll help you plan the perfect trip with real-time data on places,
              weather, and exchange rates.
            </p>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg'>
              {EXAMPLE_QUERIES.map((query) => (
                <button
                  key={query}
                  type='button'
                  onClick={() => handleExampleClick(query)}
                  className='rounded-xl border border-border bg-card px-4 py-3 text-left text-sm hover:bg-accent hover:border-primary/30 transition-colors'
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

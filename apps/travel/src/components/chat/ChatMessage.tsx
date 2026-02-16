'use client';

import type { UIMessage } from 'ai';
import { Bot, User } from 'lucide-react';
import Markdown from 'react-markdown';

import { CurrencyCard } from '@/components/cards/CurrencyCard';
import { PlaceCard } from '@/components/cards/PlaceCard';
import { WeatherCard } from '@/components/cards/WeatherCard';
import type { ExchangeRateData, PlaceEntity, WeatherData } from '@/lib/types';

interface ChatMessageProps {
  message: UIMessage;
  onPlaceSelect?: (place: PlaceEntity) => void;
  onPlaceHover?: (placeId: string | undefined) => void;
  onAlertClick?: (place: PlaceEntity) => void;
  selectedPlaceId?: string;
  isStreaming?: boolean;
}

export function ChatMessage({
  message,
  onPlaceSelect,
  onPlaceHover,
  onAlertClick,
  selectedPlaceId,
  isStreaming,
}: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ring-border/50 ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}
        aria-hidden
      >
        {isUser ? <User className='h-4 w-4' /> : <Bot className='h-4 w-4' />}
      </div>
      <div className={`flex-1 min-w-0 space-y-1.5 ${isUser ? 'text-right' : ''}`}>
        {isUser ? (
          <div className='inline-block rounded-2xl rounded-tr-sm bg-primary/[0.08] dark:bg-primary/15 border border-primary/20 text-foreground px-4 py-2.5 text-sm shadow-sm max-w-[85%]'>
            {message.parts.map((part) =>
              part.type === 'text' ? <span key={`text-${part.text.slice(0, 20)}`}>{part.text}</span> : null,
            )}
          </div>
        ) : (
          <div className='space-y-2'>
            {message.parts.map((part) => {
              if (part.type === 'text') {
                return (
                  <div
                    key={`md-${part.text.slice(0, 30)}`}
                    className='rounded-2xl rounded-tl-sm bg-muted/50 dark:bg-muted/30 px-4 py-3 border border-border/50 prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:my-2 first:prose-p:mt-0 last:prose-p:mb-0 prose-ul:my-2 prose-ul:list-disc prose-ul:pl-5 prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-5 prose-li:my-0.5 prose-pre:my-2 prose-pre:rounded-lg prose-pre:bg-muted/80 prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:border prose-pre:border-border/50 prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none'
                  >
                    <Markdown>{part.text}</Markdown>
                    {isStreaming && (
                      <span
                        className='ml-0.5 inline-block h-4 w-1 animate-pulse rounded-sm bg-primary align-middle'
                        aria-hidden
                      />
                    )}
                  </div>
                );
              }

              const toolPart = part as unknown as { type: string; toolCallId?: string };
              const key = toolPart.toolCallId ?? `part-${part.type}`;
              return renderToolPart(part, key, onPlaceSelect, onPlaceHover, onAlertClick, selectedPlaceId);
            })}
            <p className='text-[10px] text-muted-foreground mt-1' aria-hidden>
              방금
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function renderToolPart(
  part: UIMessage['parts'][number],
  key: string,
  onPlaceSelect?: (place: PlaceEntity) => void,
  onPlaceHover?: (placeId: string | undefined) => void,
  onAlertClick?: (place: PlaceEntity) => void,
  selectedPlaceId?: string,
) {
  if (
    part.type === 'text' ||
    part.type === 'reasoning' ||
    part.type === 'file' ||
    part.type === 'step-start' ||
    part.type === 'source-url' ||
    part.type === 'source-document'
  ) {
    return null;
  }

  const toolPart = part as { type: string; state: string; toolCallId: string; output?: unknown; errorMessage?: string };
  if (toolPart.state === 'output-error') {
    return (
      <div
        key={key}
        className='my-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive'
      >
        일부 정보를 불러오지 못했어요. 다른 결과는 위에 표시됩니다.
      </div>
    );
  }
  if (toolPart.state !== 'output-available') {
    return <CardSkeleton key={key} label='장소 검색 중…' />;
  }

  if (part.type.startsWith('tool-')) {
    const toolName = part.type.slice(5);

    if (toolName === 'searchPlaces' && toolPart.output) {
      const data = toolPart.output as { places: PlaceEntity[] };
      if (data.places && data.places.length > 0) {
        return (
          <div key={key} className='grid grid-cols-1 gap-2 my-2 sm:grid-cols-2'>
            {data.places.map((place) => (
              // Hover wrapper for map marker highlight; div is intentional (not a form group).
              // biome-ignore lint/a11y/useSemanticElements: wrapper is not a fieldset.
              <div
                key={place.placeId}
                role='group'
                data-place-id={place.placeId}
                onMouseEnter={() => onPlaceHover?.(place.placeId)}
                onMouseLeave={() => onPlaceHover?.(undefined)}
              >
                <PlaceCard
                  place={place}
                  isSelected={selectedPlaceId === place.placeId}
                  onSelect={onPlaceSelect}
                  onAlertClick={onAlertClick}
                />
              </div>
            ))}
          </div>
        );
      }
    }

    if (toolName === 'getWeatherHistory' && toolPart.output) {
      const data = toolPart.output as WeatherData;
      if (data.monthly && data.monthly.length > 0) {
        return <WeatherCard key={key} data={data} />;
      }
    }

    if (toolName === 'getExchangeRate' && toolPart.output) {
      const data = toolPart.output as ExchangeRateData;
      if (Object.keys(data.rates).length > 0) {
        return <CurrencyCard key={key} data={data} />;
      }
    }
  }

  if (part.type === 'dynamic-tool') {
    const dynPart = part as {
      type: 'dynamic-tool';
      toolName: string;
      state: string;
      toolCallId: string;
      output?: unknown;
    };
    if (dynPart.state === 'output-error') {
      return (
        <div
          key={key}
          className='my-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive'
        >
          일부 정보를 불러오지 못했어요. 다른 결과는 위에 표시됩니다.
        </div>
      );
    }
    if (dynPart.state !== 'output-available') return <CardSkeleton key={key} label='장소 검색 중…' />;

    if (dynPart.toolName === 'searchPlaces' && dynPart.output) {
      const data = dynPart.output as { places: PlaceEntity[] };
      if (data.places && data.places.length > 0) {
        return (
          <div key={key} className='grid grid-cols-1 gap-2 my-2 sm:grid-cols-2'>
            {data.places.map((place) => (
              // Hover wrapper for map marker highlight; div is intentional (not a form group).
              // biome-ignore lint/a11y/useSemanticElements: wrapper is not a fieldset.
              <div
                key={place.placeId}
                role='group'
                data-place-id={place.placeId}
                onMouseEnter={() => onPlaceHover?.(place.placeId)}
                onMouseLeave={() => onPlaceHover?.(undefined)}
              >
                <PlaceCard
                  place={place}
                  isSelected={selectedPlaceId === place.placeId}
                  onSelect={onPlaceSelect}
                  onAlertClick={onAlertClick}
                />
              </div>
            ))}
          </div>
        );
      }
    }

    if (dynPart.toolName === 'getWeatherHistory' && dynPart.output) {
      const data = dynPart.output as WeatherData;
      if (data.monthly && data.monthly.length > 0) {
        return <WeatherCard key={key} data={data} />;
      }
    }

    if (dynPart.toolName === 'getExchangeRate' && dynPart.output) {
      const data = dynPart.output as ExchangeRateData;
      if (Object.keys(data.rates).length > 0) {
        return <CurrencyCard key={key} data={data} />;
      }
    }
  }

  return null;
}

function CardSkeleton({ key: _key, label }: { key: string; label?: string }) {
  return (
    <div className='my-2'>
      {label && (
        <div className='mb-2 flex items-center gap-2 text-sm text-muted-foreground'>
          <span className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
          <span>{label}</span>
        </div>
      )}
      <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
        {[1, 2].map((i) => (
          <div key={i} className='overflow-hidden rounded-xl border border-border bg-card'>
            <div className='h-32 w-full bg-muted animate-pulse' />
            <div className='space-y-2 p-3'>
              <div className='h-4 w-[80%] rounded bg-muted animate-pulse' />
              <div className='h-3 w-3/4 rounded bg-muted animate-pulse' />
              <div className='flex gap-2'>
                <div className='h-3 w-12 rounded bg-muted animate-pulse' />
                <div className='h-3 w-16 rounded bg-muted animate-pulse' />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

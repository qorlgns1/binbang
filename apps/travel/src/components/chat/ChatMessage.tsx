'use client';

import type { UIMessage } from 'ai';
import { Bot, User } from 'lucide-react';
import type { ReactNode } from 'react';
import Markdown from 'react-markdown';

import { AccommodationCard } from '@/components/cards/AccommodationCard';
import { CurrencyCard } from '@/components/cards/CurrencyCard';
import { EsimCard } from '@/components/cards/EsimCard';
import { PlaceCard } from '@/components/cards/PlaceCard';
import { WeatherCard } from '@/components/cards/WeatherCard';
import { LighthouseSpinner } from '@/components/ui/LighthouseSpinner';
import type {
  ExchangeRateData,
  PlaceEntity,
  SearchAccommodationResult,
  SearchEsimResult,
  WeatherData,
} from '@/lib/types';

interface ChatMessageProps {
  message: UIMessage;
  onPlaceSelect?: (place: PlaceEntity) => void;
  onPlaceHover?: (placeId: string | undefined) => void;
  onAlertClick?: (place: PlaceEntity) => void;
  selectedPlaceId?: string;
  mapHoveredEntityId?: string;
  isStreaming?: boolean;
  conversationId?: string;
  sessionId?: string;
}

export function ChatMessage({
  message,
  onPlaceSelect,
  onPlaceHover,
  onAlertClick,
  selectedPlaceId,
  mapHoveredEntityId,
  isStreaming,
  conversationId,
  sessionId,
}: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ring-border/40 ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted/80 text-muted-foreground'
        }`}
        aria-hidden
      >
        {isUser ? <User className='h-4 w-4' /> : <Bot className='h-4 w-4' />}
      </div>
      <div className={`flex-1 min-w-0 space-y-2 ${isUser ? 'text-right' : ''}`}>
        {isUser ? (
          <div className='inline-block rounded-3xl bg-primary px-4 py-2.5 text-sm text-primary-foreground max-w-[85%]'>
            {message.parts.map((part, idx) =>
              part.type === 'text' ? <span key={`text-${message.id ?? 'msg'}-${idx}`}>{part.text}</span> : null,
            )}
          </div>
        ) : (
          <div className='space-y-2'>
            {message.parts.map((part, idx) => {
              if (part.type === 'text') {
                return (
                  <div
                    key={`md-${message.id ?? 'msg'}-${idx}`}
                    className='rounded-2xl bg-muted/30 dark:bg-muted/20 px-4 py-3.5 prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-p:my-2.5 first:prose-p:mt-0 last:prose-p:mb-0 prose-ul:my-2.5 prose-ul:list-disc prose-ul:pl-5 prose-ol:my-2.5 prose-ol:list-decimal prose-ol:pl-5 prose-li:my-0.5 prose-pre:my-2.5 prose-pre:rounded-xl prose-pre:bg-muted/60 prose-pre:p-4 prose-pre:overflow-x-auto prose-pre:border prose-pre:border-border/40 prose-code:bg-muted/80 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:before:content-none prose-code:after:content-none text-[0.9375rem] sm:text-base'
                    style={{ letterSpacing: '0.01em' }}
                  >
                    <Markdown>{part.text}</Markdown>
                    {isStreaming && (
                      <span
                        className='ml-0.5 inline-block h-4 w-1 animate-pulse rounded-sm bg-primary/70 align-middle'
                        aria-hidden
                      />
                    )}
                  </div>
                );
              }

              const toolPart = part as unknown as { type: string; toolCallId?: string };
              const key = toolPart.toolCallId ?? `part-${part.type}-${idx}`;
              return (
                <ToolPart
                  key={key}
                  part={part}
                  onPlaceSelect={onPlaceSelect}
                  onPlaceHover={onPlaceHover}
                  onAlertClick={onAlertClick}
                  selectedPlaceId={selectedPlaceId}
                  mapHoveredEntityId={mapHoveredEntityId}
                  conversationId={conversationId}
                  sessionId={sessionId}
                />
              );
            })}
            <p className='text-[10px] text-muted-foreground/80 mt-1.5 -ml-1 flex items-center gap-0.5' aria-hidden>
              방금
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ToolPartProps {
  part: UIMessage['parts'][number];
  onPlaceSelect?: (place: PlaceEntity) => void;
  onPlaceHover?: (placeId: string | undefined) => void;
  onAlertClick?: (place: PlaceEntity) => void;
  selectedPlaceId?: string;
  mapHoveredEntityId?: string;
  conversationId?: string;
  sessionId?: string;
}

interface EntityHoverGroupProps {
  placeId?: string;
  mapHoveredEntityId?: string;
  onPlaceHover?: (placeId: string | undefined) => void;
  children: ReactNode;
}

function EntityHoverGroup({ placeId, mapHoveredEntityId, onPlaceHover, children }: EntityHoverGroupProps) {
  if (!placeId) return <>{children}</>;

  return (
    // biome-ignore lint/a11y/useSemanticElements: wrapper is not a form fieldset.
    <div
      role='group'
      data-place-id={placeId}
      className={`rounded-2xl transition-all duration-200 ${mapHoveredEntityId === placeId ? 'ring-2 ring-primary/30 shadow-md' : ''}`}
      onMouseEnter={() => onPlaceHover?.(placeId)}
      onMouseLeave={() => onPlaceHover?.(undefined)}
      onFocus={() => onPlaceHover?.(placeId)}
      onBlur={() => onPlaceHover?.(undefined)}
    >
      {children}
    </div>
  );
}

function ToolPart({
  part,
  onPlaceSelect,
  onPlaceHover,
  onAlertClick,
  selectedPlaceId,
  mapHoveredEntityId,
  conversationId,
  sessionId,
}: ToolPartProps) {
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

  // tool- 과 dynamic-tool 모두 toolName / state / output 으로 정규화
  let toolName: string;
  let state: string;
  let output: unknown;

  if (part.type === 'dynamic-tool') {
    const p = part as { toolName: string; state: string; output?: unknown };
    toolName = p.toolName;
    state = p.state;
    output = p.output;
  } else if (part.type.startsWith('tool-')) {
    const p = part as { state: string; output?: unknown };
    toolName = part.type.slice(5);
    state = p.state;
    output = p.output;
  } else {
    return null;
  }

  if (state === 'output-error') {
    return (
      <div className='my-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive'>
        일부 정보를 불러오지 못했어요. 다른 결과는 위에 표시됩니다.
      </div>
    );
  }
  if (state !== 'output-available') {
    return <CardSkeleton label='장소 검색 중…' />;
  }

  if (toolName === 'searchPlaces' && output) {
    const data = output as { places: PlaceEntity[] };
    if (data.places && data.places.length > 0) {
      return (
        <div className='grid grid-cols-1 gap-3 my-3 sm:grid-cols-2'>
          {data.places.map((place) => (
            <EntityHoverGroup
              key={place.placeId}
              placeId={place.placeId}
              mapHoveredEntityId={mapHoveredEntityId}
              onPlaceHover={onPlaceHover}
            >
              <PlaceCard
                place={place}
                isSelected={selectedPlaceId === place.placeId}
                onSelect={onPlaceSelect}
                onAlertClick={onAlertClick}
              />
            </EntityHoverGroup>
          ))}
        </div>
      );
    }
  }

  if (toolName === 'getWeatherHistory' && output) {
    const data = output as WeatherData;
    if (data.monthly && data.monthly.length > 0) {
      return <WeatherCard data={data} />;
    }
  }

  if (toolName === 'getExchangeRate' && output) {
    const data = output as ExchangeRateData;
    if (Object.keys(data.rates).length > 0) {
      return <CurrencyCard data={data} />;
    }
  }

  if (toolName === 'searchAccommodation' && output) {
    const data = output as SearchAccommodationResult;
    const affiliate = data.affiliate;
    return (
      <div className='my-2 space-y-3'>
        {affiliate && (
          <EntityHoverGroup
            placeId={affiliate.placeId}
            mapHoveredEntityId={mapHoveredEntityId}
            onPlaceHover={onPlaceHover}
          >
            <AccommodationCard
              accommodation={affiliate}
              ctaEnabled={data.ctaEnabled}
              trackingContext={{ conversationId, sessionId, provider: data.provider }}
            />
          </EntityHoverGroup>
        )}
        {data.alternatives.length > 0 && (
          <div>
            <p className='mb-1.5 text-xs text-muted-foreground'>일반 검색 결과</p>
            <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
              {data.alternatives.map((acc) => (
                <EntityHoverGroup
                  key={acc.placeId}
                  placeId={acc.placeId}
                  mapHoveredEntityId={mapHoveredEntityId}
                  onPlaceHover={onPlaceHover}
                >
                  <AccommodationCard accommodation={acc} ctaEnabled={false} />
                </EntityHoverGroup>
              ))}
            </div>
          </div>
        )}
        {data.alternatives.length < 2 && <p className='text-xs text-muted-foreground'>대안 데이터가 부족합니다</p>}
      </div>
    );
  }

  if (toolName === 'searchEsim' && output) {
    const data = output as SearchEsimResult;
    if (!data.primary) return null;
    return (
      <div className='my-2'>
        <EsimCard
          esim={data.primary}
          ctaEnabled={data.ctaEnabled}
          trackingContext={{ conversationId, sessionId, provider: data.provider }}
        />
      </div>
    );
  }

  return null;
}

function CardSkeleton({ label }: { label?: string }) {
  return (
    <div className='my-2'>
      {label && (
        <div className='mb-2 flex items-center gap-2 text-sm text-muted-foreground'>
          <LighthouseSpinner size='sm' />
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

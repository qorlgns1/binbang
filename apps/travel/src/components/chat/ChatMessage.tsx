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
  onAlertClick?: (place: PlaceEntity) => void;
  selectedPlaceId?: string;
}

export function ChatMessage({ message, onPlaceSelect, onAlertClick, selectedPlaceId }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        {isUser ? <User className='h-4 w-4' /> : <Bot className='h-4 w-4' />}
      </div>
      <div className={`flex-1 space-y-2 ${isUser ? 'text-right' : ''}`}>
        {isUser ? (
          <div className='inline-block rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-primary-foreground text-sm'>
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
                    className='prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-muted'
                  >
                    <Markdown>{part.text}</Markdown>
                  </div>
                );
              }

              const toolPart = part as unknown as { type: string; toolCallId?: string };
              const key = toolPart.toolCallId ?? `part-${part.type}`;
              return renderToolPart(part, key, onPlaceSelect, onAlertClick, selectedPlaceId);
            })}
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

  const toolPart = part as { type: string; state: string; toolCallId: string; output?: unknown };
  if (toolPart.state !== 'output-available') return null;

  if (part.type.startsWith('tool-')) {
    const toolName = part.type.slice(5);

    if (toolName === 'searchPlaces' && toolPart.output) {
      const data = toolPart.output as { places: PlaceEntity[] };
      if (data.places && data.places.length > 0) {
        return (
          <div key={key} className='grid grid-cols-1 sm:grid-cols-2 gap-2 my-2'>
            {data.places.map((place) => (
              <PlaceCard
                key={place.placeId}
                place={place}
                isSelected={selectedPlaceId === place.placeId}
                onSelect={onPlaceSelect}
                onAlertClick={onAlertClick}
              />
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
    if (dynPart.state !== 'output-available') return null;

    if (dynPart.toolName === 'searchPlaces' && dynPart.output) {
      const data = dynPart.output as { places: PlaceEntity[] };
      if (data.places && data.places.length > 0) {
        return (
          <div key={key} className='grid grid-cols-1 sm:grid-cols-2 gap-2 my-2'>
            {data.places.map((place) => (
              <PlaceCard
                key={place.placeId}
                place={place}
                isSelected={selectedPlaceId === place.placeId}
                onSelect={onPlaceSelect}
                onAlertClick={onAlertClick}
              />
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

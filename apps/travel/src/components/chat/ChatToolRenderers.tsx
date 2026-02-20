'use client';

import type { ReactNode } from 'react';

import { AccommodationCard } from '@/components/cards/AccommodationCard';
import { CurrencyCard } from '@/components/cards/CurrencyCard';
import { EsimCard } from '@/components/cards/EsimCard';
import { PlaceCard } from '@/components/cards/PlaceCard';
import { WeatherCard } from '@/components/cards/WeatherCard';
import type {
  ExchangeRateData,
  PlaceEntity,
  SearchAccommodationResult,
  SearchEsimResult,
  WeatherData,
} from '@/lib/types';

export interface ToolRenderContext {
  onPlaceSelect?: (place: PlaceEntity) => void;
  onPlaceHover?: (placeId: string | undefined) => void;
  onAlertClick?: (place: PlaceEntity) => void;
  selectedPlaceId?: string;
  mapHoveredEntityId?: string;
  conversationId?: string;
  sessionId?: string;
}

type ToolRenderer = (output: unknown, context: ToolRenderContext) => ReactNode;

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

function renderSearchPlaces(output: unknown, context: ToolRenderContext): ReactNode {
  const data = output as { places: PlaceEntity[] };
  if (!data.places?.length) {
    return null;
  }

  return (
    <div className='my-3 grid grid-cols-1 gap-3 sm:grid-cols-2'>
      {data.places.map((place) => (
        <EntityHoverGroup
          key={place.placeId}
          placeId={place.placeId}
          mapHoveredEntityId={context.mapHoveredEntityId}
          onPlaceHover={context.onPlaceHover}
        >
          <PlaceCard
            place={place}
            isSelected={context.selectedPlaceId === place.placeId}
            onSelect={context.onPlaceSelect}
            onAlertClick={context.onAlertClick}
          />
        </EntityHoverGroup>
      ))}
    </div>
  );
}

function renderWeatherHistory(output: unknown): ReactNode {
  const data = output as WeatherData;
  if (!data.monthly?.length) {
    return null;
  }

  return <WeatherCard data={data} />;
}

function renderExchangeRate(output: unknown): ReactNode {
  const data = output as ExchangeRateData;
  if (!Object.keys(data.rates).length) {
    return null;
  }

  return <CurrencyCard data={data} />;
}

function renderSearchAccommodation(output: unknown, context: ToolRenderContext): ReactNode {
  const data = output as SearchAccommodationResult;
  const affiliate = data.affiliate;

  return (
    <div className='my-2 space-y-3'>
      {affiliate && (
        <EntityHoverGroup
          placeId={affiliate.placeId}
          mapHoveredEntityId={context.mapHoveredEntityId}
          onPlaceHover={context.onPlaceHover}
        >
          <AccommodationCard
            accommodation={affiliate}
            ctaEnabled={data.ctaEnabled}
            trackingContext={{
              conversationId: context.conversationId,
              sessionId: context.sessionId,
              provider: data.provider,
            }}
          />
        </EntityHoverGroup>
      )}
      {data.alternatives.length > 0 && (
        <div>
          <p className='mb-1.5 text-xs text-muted-foreground'>일반 검색 결과</p>
          <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
            {data.alternatives.map((accommodation) => (
              <EntityHoverGroup
                key={accommodation.placeId}
                placeId={accommodation.placeId}
                mapHoveredEntityId={context.mapHoveredEntityId}
                onPlaceHover={context.onPlaceHover}
              >
                <AccommodationCard accommodation={accommodation} ctaEnabled={false} />
              </EntityHoverGroup>
            ))}
          </div>
        </div>
      )}
      {data.alternatives.length < 2 && <p className='text-xs text-muted-foreground'>대안 데이터가 부족합니다</p>}
    </div>
  );
}

function renderSearchEsim(output: unknown, context: ToolRenderContext): ReactNode {
  const data = output as SearchEsimResult;
  if (!data.primary) {
    return null;
  }

  return (
    <div className='my-2'>
      <EsimCard
        esim={data.primary}
        ctaEnabled={data.ctaEnabled}
        trackingContext={{
          conversationId: context.conversationId,
          sessionId: context.sessionId,
          provider: data.provider,
        }}
      />
    </div>
  );
}

const TOOL_RENDERERS = {
  searchPlaces: renderSearchPlaces,
  getWeatherHistory: renderWeatherHistory,
  getExchangeRate: renderExchangeRate,
  searchAccommodation: renderSearchAccommodation,
  searchEsim: renderSearchEsim,
} satisfies Record<string, ToolRenderer>;

function isKnownToolName(toolName: string): toolName is keyof typeof TOOL_RENDERERS {
  return toolName in TOOL_RENDERERS;
}

export function renderToolOutput(toolName: string, output: unknown, context: ToolRenderContext): ReactNode | null {
  if (!isKnownToolName(toolName)) {
    return null;
  }

  return TOOL_RENDERERS[toolName](output, context);
}

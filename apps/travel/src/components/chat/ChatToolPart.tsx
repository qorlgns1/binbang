'use client';

import type { UIMessage } from 'ai';
import type { ReactNode } from 'react';

import { AccommodationCard } from '@/components/cards/AccommodationCard';
import { CurrencyCard } from '@/components/cards/CurrencyCard';
import { EsimCard } from '@/components/cards/EsimCard';
import { PlaceCard } from '@/components/cards/PlaceCard';
import { WeatherCard } from '@/components/cards/WeatherCard';
import { normalizeToolPart } from '@/components/chat/toolPartUtils';
import { LighthouseSpinner } from '@/components/ui/LighthouseSpinner';
import type {
  ExchangeRateData,
  PlaceEntity,
  SearchAccommodationResult,
  SearchEsimResult,
  WeatherData,
} from '@/lib/types';

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

type ToolRenderContext = Omit<ToolPartProps, 'part'>;
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
            <div className='h-32 w-full animate-pulse bg-muted' />
            <div className='space-y-2 p-3'>
              <div className='h-4 w-[80%] animate-pulse rounded bg-muted' />
              <div className='h-3 w-3/4 animate-pulse rounded bg-muted' />
              <div className='flex gap-2'>
                <div className='h-3 w-12 animate-pulse rounded bg-muted' />
                <div className='h-3 w-16 animate-pulse rounded bg-muted' />
              </div>
            </div>
          </div>
        ))}
      </div>
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

export function ChatToolPart({
  part,
  onPlaceSelect,
  onPlaceHover,
  onAlertClick,
  selectedPlaceId,
  mapHoveredEntityId,
  conversationId,
  sessionId,
}: ToolPartProps) {
  const normalized = normalizeToolPart(part);
  if (!normalized) {
    return null;
  }

  const { toolName, state, output } = normalized;
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

  if (!isKnownToolName(toolName)) {
    return null;
  }

  const renderer = TOOL_RENDERERS[toolName];
  return renderer(output, {
    onPlaceSelect,
    onPlaceHover,
    onAlertClick,
    selectedPlaceId,
    mapHoveredEntityId,
    conversationId,
    sessionId,
  });
}

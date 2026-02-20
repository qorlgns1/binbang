'use client';

import type { UIMessage } from 'ai';

import { renderToolOutput } from '@/components/chat/ChatToolRenderers';
import { normalizeToolPart } from '@/components/chat/toolPartUtils';
import { LighthouseSpinner } from '@/components/ui/LighthouseSpinner';
import type { PlaceEntity } from '@/lib/types';

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

  return renderToolOutput(toolName, output, {
    onPlaceSelect,
    onPlaceHover,
    onAlertClick,
    selectedPlaceId,
    mapHoveredEntityId,
    conversationId,
    sessionId,
  });
}

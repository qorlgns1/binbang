'use client';

import type { UIMessage } from 'ai';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

import { renderToolOutput } from '@/components/chat/ChatToolRenderers';
import { normalizeToolPart } from '@/components/chat/toolPartUtils';
import { LighthouseSpinner } from '@/components/ui/LighthouseSpinner';
import type { PlaceEntity } from '@/lib/types';
import { useChatSessionStore } from '@/stores/useChatSessionStore';
import { useModalStore } from '@/stores/useModalStore';
import { usePlaceStore } from '@/stores/usePlaceStore';

interface ToolPartProps {
  part: UIMessage['parts'][number];
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

export function ChatToolPart({ part }: ToolPartProps) {
  const { selectedPlaceId, mapHoveredEntityId, selectPlace, hoverPlace } = usePlaceStore();
  const { sessionId, currentConversationId } = useChatSessionStore();
  const openLoginModal = useModalStore((s) => s.openLoginModal);
  const { status: authStatus } = useSession();

  const handleAlertClick = (_place: PlaceEntity) => {
    if (authStatus === 'authenticated') {
      toast.info('빈방 알림 기능은 준비 중이에요.');
      return;
    }
    openLoginModal('bookmark');
  };

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
    onPlaceSelect: selectPlace,
    onPlaceHover: hoverPlace,
    onAlertClick: handleAlertClick,
    selectedPlaceId,
    mapHoveredEntityId,
    conversationId: currentConversationId,
    sessionId: sessionId ?? undefined,
  });
}

'use client';

import { useEffect } from 'react';

import { useSession } from 'next-auth/react';

import { AlertOctagon, AlertTriangle, BellOff, PauseCircle, TrendingUp } from 'lucide-react';

import { ACTION_CARD_ACCENT, ACTION_CARD_STYLES } from '@/app/(app)/dashboard/_lib/constants';
import { trackActionCardClicked, trackActionCardImpression } from '@/app/(app)/dashboard/_lib/dashboardTracker';
import type { ActionCard as ActionCardData, ActionCardType } from '@/app/(app)/dashboard/_lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ============================================================================
// Icon Mapping
// ============================================================================

const ACTION_CARD_ICONS: Record<ActionCardType, React.ElementType> = {
  QUOTA_REACHED: AlertOctagon,
  RECENT_ERROR_DETECTED: AlertTriangle,
  NOTIFICATION_NOT_CONNECTED: BellOff,
  QUOTA_NEAR_LIMIT: TrendingUp,
  PAUSED_ACCOMMODATIONS_EXIST: PauseCircle,
};

// ============================================================================
// Component
// ============================================================================

interface ActionCardProps {
  card: ActionCardData;
  onCtaClick: (card: ActionCardData) => void;
}

/**
 * Render an action card with icon, title, description and a CTA button, while recording per-session impressions on mount and click events when the CTA is pressed.
 *
 * Tracks an impression for the card type when a session user exists and records a click before delegating to the provided callback.
 *
 * @param card - Action card data (includes `type`, `colorScheme`, `title`, `description`, `ctaLabel`, etc.)
 * @param onCtaClick - Callback invoked with the `card` when the CTA button is clicked
 * @returns A React element representing the rendered action card
 */
export function ActionCard({ card, onCtaClick }: ActionCardProps): React.ReactElement {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';

  // TR-006/007: impression 트래킹 (마운트 시 카드타입별 세션당 1회)
  useEffect(() => {
    if (userId) {
      trackActionCardImpression(userId, card.type);
    }
  }, [userId, card.type]);

  const handleCtaClick = (): void => {
    // IS-007: 트래킹 → 액션 실행
    if (userId) {
      trackActionCardClicked(userId, card.type);
    }
    onCtaClick(card);
  };

  const Icon = ACTION_CARD_ICONS[card.type];

  return (
    <Card
      className={cn(
        'border border-l-4 transition-shadow duration-140 ease-out hover:shadow-md',
        ACTION_CARD_STYLES[card.colorScheme],
        ACTION_CARD_ACCENT[card.colorScheme],
      )}
    >
      <CardContent className='flex min-h-[140px] flex-col justify-between gap-3 pt-6'>
        <div className='flex gap-3'>
          <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-background/60'>
            <Icon className='size-5' />
          </div>
          <div className='space-y-1'>
            <p className='text-sm font-medium leading-[1.4] md:text-base'>{card.title}</p>
            <p className='text-sm leading-normal opacity-80'>{card.description}</p>
          </div>
        </div>
        <Button variant='outline' onClick={handleCtaClick} className='w-full min-h-[44px] md:w-auto'>
          {card.ctaLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

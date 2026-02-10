import { ACTION_EMPTY_DESCRIPTION, ACTION_EMPTY_TITLE } from '@/app/(app)/dashboard/_lib/constants';
import type { ActionCard as ActionCardData } from '@/app/(app)/dashboard/_lib/types';
import { Card, CardContent } from '@/components/ui/card';

import { ActionCard } from './action-card';
import { LighthouseCalm } from './empty-illustrations';

interface ActionCenterProps {
  cards: ActionCardData[];
  onCtaClick: (card: ActionCardData) => void;
}

export function ActionCenter({ cards, onCtaClick }: ActionCenterProps): React.ReactElement {
  // FR-025: 0건 시 안정 상태 카드
  if (cards.length === 0) {
    return (
      <Card className='border-chart-3/20 bg-chart-3/10'>
        <CardContent className='flex min-h-[140px] flex-col items-center justify-center gap-2 py-8 text-center'>
          <LighthouseCalm className='mb-1 text-muted-foreground' />
          <p className='text-sm font-medium leading-[1.4] text-foreground md:text-base'>{ACTION_EMPTY_TITLE}</p>
          <p className='text-sm leading-normal text-muted-foreground'>{ACTION_EMPTY_DESCRIPTION}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
      {cards.map((card) => (
        <ActionCard
          key={card.type}
          card={card}
          onCtaClick={onCtaClick}
        />
      ))}
    </div>
  );
}

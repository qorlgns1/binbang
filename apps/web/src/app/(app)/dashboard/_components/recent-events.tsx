'use client';

import { useState } from 'react';

import { EVENTS_EMPTY_TEXT, EVENTS_INCREMENT, EVENTS_INITIAL_COUNT } from '@/app/(app)/dashboard/_lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { RecentLog } from '@/types/accommodation';

import { LighthouseQuiet } from './empty-illustrations';
import { EventRow } from './event-row';
import { SectionError } from './section-error';
import { SectionSkeleton } from './section-skeleton';

interface RecentEventsProps {
  events: RecentLog[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function RecentEvents({ events, isLoading, isError, onRetry }: RecentEventsProps): React.ReactElement {
  const [visibleCount, setVisibleCount] = useState(EVENTS_INITIAL_COUNT);

  if (isError) {
    return (
      <section>
        <h2 className='mb-3 text-lg font-semibold leading-[1.3] md:text-xl'>최근 이벤트</h2>
        <SectionError onRetry={onRetry} />
      </section>
    );
  }

  if (isLoading) {
    return (
      <section>
        <h2 className='mb-3 text-lg font-semibold leading-[1.3] md:text-xl'>최근 이벤트</h2>
        <SectionSkeleton variant='events' />
      </section>
    );
  }

  const visibleEvents = events.slice(0, visibleCount);
  const hasMore = visibleCount < events.length;

  const handleLoadMore = (): void => {
    setVisibleCount((prev) => prev + EVENTS_INCREMENT);
  };

  return (
    <section>
      <h2 className='mb-3 text-lg font-semibold leading-[1.3] md:text-xl'>최근 이벤트</h2>
      <Card>
        {events.length === 0 ? (
          <CardContent className='flex flex-col items-center gap-2 py-12 text-center'>
            <LighthouseQuiet className='mb-1 text-muted-foreground' />
            <p className='text-sm text-muted-foreground'>{EVENTS_EMPTY_TEXT}</p>
          </CardContent>
        ) : (
          <>
            <div>
              {visibleEvents.map((event, index) => (
                <EventRow
                  key={event.id}
                  event={event}
                  isLast={index === visibleEvents.length - 1}
                />
              ))}
            </div>
            {hasMore && (
              <CardContent className='pt-0 pb-4 text-center'>
                <Button
                  variant='ghost'
                  onClick={handleLoadMore}
                  className='w-full min-h-[44px] md:w-auto'
                >
                  더보기
                </Button>
              </CardContent>
            )}
          </>
        )}
      </Card>
    </section>
  );
}

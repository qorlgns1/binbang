'use client';

import { useState } from 'react';

import { EVENTS_EMPTY_TEXT, EVENTS_INCREMENT, EVENTS_INITIAL_COUNT } from '@/app/(app)/dashboard/_lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { RecentLog } from '@/types/accommodation';

import { LighthouseQuiet } from './EmptyIllustrations';
import { EventRow } from './EventRow';
import { SectionError } from './SectionError';
import { SectionSkeleton } from './SectionSkeleton';

interface RecentEventsProps {
  events: RecentLog[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

/**
 * Render the "최근 이벤트" dashboard section that displays recent events.
 *
 * Shows an error state with a retry action, a loading skeleton while data is loading,
 * an empty illustration and message when there are no events, or a paginated list of
 * event rows with a "더보기" button to reveal more items.
 *
 * @param events - Array of recent event objects to display
 * @param isLoading - Whether the events are currently loading
 * @param isError - Whether loading events failed and should show the error state
 * @param onRetry - Callback invoked when the user requests a retry from the error state
 * @returns A React element containing the recent events section
 */
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
                <EventRow key={event.id} event={event} isLast={index === visibleEvents.length - 1} />
              ))}
            </div>
            {hasMore && (
              <CardContent className='pt-0 pb-4 text-center'>
                <Button variant='ghost' onClick={handleLoadMore} className='w-full min-h-[44px] md:w-auto'>
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

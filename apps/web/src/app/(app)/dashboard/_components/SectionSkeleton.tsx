import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SectionSkeletonProps {
  variant: 'kpi' | 'board' | 'action' | 'events';
}

const KPI_SKELETON_KEYS = ['kpi-1', 'kpi-2', 'kpi-3', 'kpi-4'];
const ACTION_SKELETON_KEYS = ['action-1', 'action-2'];
const BOARD_SKELETON_KEYS = ['board-1', 'board-2', 'board-3'];
const EVENT_SKELETON_KEYS = ['event-1', 'event-2', 'event-3', 'event-4', 'event-5'];

/**
 * Render a skeleton placeholder layout for a dashboard section.
 *
 * @param variant - Which skeleton layout to render:
 *   - `'kpi'`: grid of four compact KPI cards
 *   - `'action'`: grid of two larger action cards
 *   - `'board'`: single card with three row placeholders and dividers
 *   - `'events'`: single card with five event row placeholders
 * @returns A React element containing the requested skeleton UI layout
 */
export function SectionSkeleton({ variant }: SectionSkeletonProps): React.ReactElement {
  switch (variant) {
    case 'kpi':
      return (
        <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4'>
          {KPI_SKELETON_KEYS.map((key) => (
            <Card key={key}>
              <CardContent className='flex min-h-[104px] items-center gap-4 pt-6'>
                <Skeleton className='size-10 shrink-0 rounded-lg' />
                <div className='flex flex-1 flex-col gap-2'>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-8 w-16' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );

    case 'action':
      return (
        <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
          {ACTION_SKELETON_KEYS.map((key) => (
            <Card key={key}>
              <CardContent className='flex min-h-[140px] flex-col justify-center gap-3 pt-6'>
                <div className='flex gap-3'>
                  <Skeleton className='size-9 shrink-0 rounded-lg' />
                  <div className='flex flex-1 flex-col gap-2'>
                    <Skeleton className='h-5 w-40' />
                    <Skeleton className='h-4 w-full' />
                  </div>
                </div>
                <Skeleton className='h-9 w-28' />
              </CardContent>
            </Card>
          ))}
        </div>
      );

    case 'board':
      return (
        <Card>
          <CardContent className='space-y-0 divide-y pt-6'>
            {BOARD_SKELETON_KEYS.map((key) => (
              <div key={key} className='flex min-h-[72px] items-center gap-4 py-4'>
                <Skeleton className='size-2.5 shrink-0 rounded-full' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-40' />
                  <Skeleton className='h-3 w-60' />
                </div>
                <Skeleton className='h-8 w-16' />
              </div>
            ))}
          </CardContent>
        </Card>
      );

    case 'events':
      return (
        <Card>
          <CardContent className='pt-6'>
            {EVENT_SKELETON_KEYS.map((key) => (
              <div key={key} className='flex min-h-[56px] items-center gap-4 py-3'>
                <Skeleton className='size-2.5 shrink-0 rounded-full' />
                <Skeleton className='h-4 flex-1' />
                <Skeleton className='h-3 w-16' />
              </div>
            ))}
          </CardContent>
        </Card>
      );
  }
}

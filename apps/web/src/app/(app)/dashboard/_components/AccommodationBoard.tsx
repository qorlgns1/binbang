'use client';

import { useMemo } from 'react';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { BOARD_EMPTY_TEXT, BOARD_TAB_LABELS, SEVERITY_SCORE } from '@/app/(app)/dashboard/_lib/constants';
import { trackBoardTabChanged } from '@/app/(app)/dashboard/_lib/dashboardTracker';
import type { BoardTab } from '@/app/(app)/dashboard/_lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Accommodation } from '@/types/accommodation';

import { AccommodationRow } from './AccommodationRow';
import { LighthouseQuiet } from './EmptyIllustrations';
import { SectionError } from './SectionError';
import { SectionSkeleton } from './SectionSkeleton';

interface AccommodationBoardProps {
  accommodations: Accommodation[];
  activeTab: BoardTab;
  onTabChange: (tab: BoardTab) => void;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const TABS: BoardTab[] = ['problem', 'all', 'paused'];

/**
 * Render a tabbed accommodation operations board with per-tab counts, filtering, and sorting.
 *
 * Displays three tabs ("problem", "all", "paused") with counts, filters accommodations by the active tab,
 * sorts results first by severity and then by most recent check, and renders either an empty-state illustration
 * or a list of AccommodationRow items. While loading or in an error state it renders the corresponding
 * skeleton or error section. When the active tab changes and a user is authenticated, the change is tracked
 * and `onTabChange` is invoked.
 *
 * @param accommodations - Array of accommodations to display and evaluate for counts, filtering, and sorting
 * @param activeTab - Currently selected board tab ('problem' | 'all' | 'paused')
 * @param onTabChange - Callback invoked with the new tab when the user selects a different tab
 * @param isLoading - When true, the component renders a board skeleton instead of the content
 * @param isError - When true, the component renders an error section with a retry action
 * @param onRetry - Callback invoked when retry is requested from the error section
 * @returns A React element representing the accommodation board UI
 */
export function AccommodationBoard({
  accommodations,
  activeTab,
  onTabChange,
  isLoading,
  isError,
  onRetry,
}: AccommodationBoardProps): React.ReactElement {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';

  // 탭별 건수 계산
  const tabCounts = useMemo(
    (): Record<BoardTab, number> => ({
      problem: accommodations.filter((a) => a.lastStatus === 'ERROR' || a.lastStatus === 'UNKNOWN').length,
      all: accommodations.length,
      paused: accommodations.filter((a) => !a.isActive).length,
    }),
    [accommodations],
  );

  // FR-032 + FR-033: 필터링 및 정렬
  const filteredAccommodations = useMemo(() => {
    let filtered: Accommodation[];
    switch (activeTab) {
      case 'problem':
        filtered = accommodations.filter((a) => a.lastStatus === 'ERROR' || a.lastStatus === 'UNKNOWN');
        break;
      case 'paused':
        filtered = accommodations.filter((a) => !a.isActive);
        break;
      case 'all':
        filtered = [...accommodations];
        break;
    }

    return filtered.sort((a, b) => {
      const sevA = SEVERITY_SCORE[a.lastStatus] ?? 0;
      const sevB = SEVERITY_SCORE[b.lastStatus] ?? 0;
      if (sevB !== sevA) return sevB - sevA;

      const dateA = a.lastCheck ? new Date(a.lastCheck).getTime() : 0;
      const dateB = b.lastCheck ? new Date(b.lastCheck).getTime() : 0;
      return dateB - dateA;
    });
  }, [accommodations, activeTab]);

  if (isError) {
    return (
      <section>
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-lg font-semibold leading-[1.3] md:text-xl'>숙소 운영 보드</h2>
          <Button asChild size='sm'>
            <Link href='/accommodations/new'>
              <Plus className='mr-1.5 size-4' />
              숙소 추가
            </Link>
          </Button>
        </div>
        <SectionError onRetry={onRetry} />
      </section>
    );
  }

  if (isLoading) {
    return (
      <section>
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-lg font-semibold leading-[1.3] md:text-xl'>숙소 운영 보드</h2>
          <Button asChild size='sm'>
            <Link href='/accommodations/new'>
              <Plus className='mr-1.5 size-4' />
              숙소 추가
            </Link>
          </Button>
        </div>
        <SectionSkeleton variant='board' />
      </section>
    );
  }

  const handleTabChange = (value: string): void => {
    const tab = value as BoardTab;
    if (tab !== activeTab) {
      if (userId) {
        trackBoardTabChanged(userId, BOARD_TAB_LABELS[tab]);
      }
      onTabChange(tab);
    }
  };

  return (
    <section>
      <div className='mb-3 flex items-center justify-between'>
        <h2 className='text-lg font-semibold leading-[1.3] md:text-xl'>숙소 운영 보드</h2>
        <Button asChild size='sm'>
          <Link href='/accommodations/new'>
            <Plus className='mr-1.5 size-4' />
            숙소 추가
          </Link>
        </Button>
      </div>
      <Card>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <CardHeader className='border-b'>
            <TabsList>
              {TABS.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {BOARD_TAB_LABELS[tab]}
                  <span className='ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground'>
                    {tabCounts[tab]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </CardHeader>

          {TABS.map((tab) => (
            <TabsContent key={tab} value={tab} className='mt-0'>
              {activeTab === tab && filteredAccommodations.length === 0 ? (
                <CardContent className='flex flex-col items-center gap-2 py-12 text-center'>
                  <LighthouseQuiet className='mb-1 text-muted-foreground' />
                  <p className='text-sm text-muted-foreground'>{BOARD_EMPTY_TEXT[tab]}</p>
                </CardContent>
              ) : (
                <div className='divide-y'>
                  {filteredAccommodations.map((acc) => (
                    <AccommodationRow key={acc.id} accommodation={acc} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </section>
  );
}

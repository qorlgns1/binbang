'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAccommodationsQuery } from '@/features/accommodations/queries';
import { useRecentLogsQuery } from '@/features/logs/queries';
import { useUserQuotaQuery } from '@/features/user/queries';

import { AccommodationBoard } from './_components/accommodation-board';
import { ActionCenter } from './_components/action-center';
import { LighthouseHero } from './_components/empty-illustrations';
import { KpiStrip } from './_components/kpi-strip';
import { RecentEvents } from './_components/recent-events';
import { SectionSkeleton } from './_components/section-skeleton';
import { generateActionCards } from './_lib/action-card-generator';
import { PAGE_SUBTITLE, PAGE_TITLE } from './_lib/constants';
import { trackDashboardViewed } from './_lib/dashboard-tracker';
import type { ActionCard, BoardTab, DashboardMetrics } from './_lib/types';

// ============================================================================
// Props
// ============================================================================

interface DashboardContentProps {
  hasKakaoToken: boolean;
}

// ============================================================================
// Component
/**
 * Render the dashboard UI composed of a KPI strip, action center, accommodation board, and recent events.
 *
 * @param hasKakaoToken - Whether the current user has a Kakao token; affects generation and behavior of action cards.
 * @returns The dashboard UI as a React element containing metrics, action cards, the accommodations board, and recent events.
 */

export function DashboardContent({ hasKakaoToken }: DashboardContentProps): React.ReactElement {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? '';

  // 데이터 훅 (IS-001: 병렬 요청)
  const {
    data: accommodations = [],
    isPending: accLoading,
    isError: accError,
    refetch: refetchAcc,
  } = useAccommodationsQuery();
  const {
    data: recentLogs = [],
    isPending: logsLoading,
    isError: logsError,
    refetch: refetchLogs,
  } = useRecentLogsQuery();
  const { data: quotaData, isPending: quotaLoading } = useUserQuotaQuery();

  // DF-002 ~ DF-010: 파생 메트릭 계산
  const metrics: DashboardMetrics = useMemo(() => {
    const totalCount = accommodations.length;
    const activeCount = accommodations.filter((a) => a.isActive).length;
    const pausedCount = accommodations.filter((a) => !a.isActive).length;
    const problemCount = accommodations.filter((a) => a.lastStatus === 'ERROR' || a.lastStatus === 'UNKNOWN').length;
    const availableCount = accommodations.filter((a) => a.lastStatus === 'AVAILABLE').length;

    let quotaRatio: number | null = null;
    if (quotaData && quotaData.quotas.maxAccommodations > 0) {
      quotaRatio = quotaData.usage.accommodations / quotaData.quotas.maxAccommodations;
    }
    const quotaPercent = quotaRatio === null ? null : Math.floor(quotaRatio * 100);
    const hasRecentError = recentLogs.some((log) => log.status === 'ERROR');

    return {
      totalCount,
      activeCount,
      pausedCount,
      problemCount,
      availableCount,
      quotaRatio,
      quotaPercent,
      hasRecentError,
    };
  }, [accommodations, recentLogs, quotaData]);

  // Action 카드 생성 (FR-020 ~ FR-027)
  const actionCards = useMemo(() => generateActionCards(metrics, hasKakaoToken), [metrics, hasKakaoToken]);

  // FR-031: 보드 기본 탭
  const [activeTab, setActiveTab] = useState<BoardTab>('all');
  const hasInitializedTab = useRef(false);

  useEffect(() => {
    if (!accLoading && !hasInitializedTab.current) {
      hasInitializedTab.current = true;
      if (metrics.problemCount > 0) {
        setActiveTab('problem');
      }
    }
  }, [accLoading, metrics.problemCount]);

  // TR-005: dashboard_viewed (최초 완전 렌더 시 1회)
  const hasTrackedViewed = useRef(false);

  useEffect(() => {
    if (!accLoading && !logsLoading && !quotaLoading && userId && !hasTrackedViewed.current) {
      hasTrackedViewed.current = true;
      trackDashboardViewed(userId);
    }
  }, [accLoading, logsLoading, quotaLoading, userId]);

  // 보드 섹션 ref (CTA scroll 용)
  const boardRef = useRef<HTMLDivElement>(null);

  // CTA 핸들러
  const handleCtaClick = useCallback(
    (card: ActionCard): void => {
      switch (card.ctaAction) {
        case 'navigate_pricing':
          router.push('/pricing');
          break;
        case 'navigate_kakao':
          void (async () => {
            await signOut({ redirect: false });
            await signIn('kakao', { callbackUrl: '/dashboard' });
          })();
          break;
        case 'switch_tab_problem':
          setActiveTab('problem');
          boardRef.current?.scrollIntoView({ behavior: 'smooth' });
          break;
        case 'switch_tab_paused':
          setActiveTab('paused');
          boardRef.current?.scrollIntoView({ behavior: 'smooth' });
          break;
      }
    },
    [router],
  );

  const isMainLoading = accLoading || quotaLoading;

  // FR-005: 숙소 0건 전체 빈 상태
  if (!accLoading && !accError && accommodations.length === 0) {
    return (
      <>
        <Header />
        <KpiStrip
          metrics={metrics}
          isLoading={isMainLoading}
        />
        <div className='mt-6'>
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-16 text-center'>
              <LighthouseHero className='mb-4 text-muted-foreground' />
              <p className='mb-2 text-lg font-medium text-foreground'>아직 등록된 숙소가 없습니다</p>
              <p className='mb-6 text-sm text-muted-foreground'>첫 번째 숙소를 등록하고 빈방 소식을 받아보세요</p>
              <Button asChild>
                <Link href='/accommodations/new'>첫 번째 숙소 등록하기</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      {/* CP-001, CP-002 */}
      <Header />

      {/* FR-001: KPI Strip → Action Center → 숙소 운영 보드 → 최근 이벤트 */}
      {/* DS-019: stagger 진입 애니메이션 (50ms 간격) */}
      <div className='space-y-6'>
        {/* Section 1: KPI Strip */}
        <section className='animate-dashboard-enter'>
          <KpiStrip
            metrics={metrics}
            isLoading={isMainLoading}
          />
        </section>

        {/* Section 2: Action Center */}
        <section className='animate-dashboard-enter [animation-delay:60ms]'>
          {isMainLoading ? (
            <SectionSkeleton variant='action' />
          ) : (
            <ActionCenter
              cards={actionCards}
              onCtaClick={handleCtaClick}
            />
          )}
        </section>

        {/* Section 3: 숙소 운영 보드 */}
        <div
          ref={boardRef}
          className='animate-dashboard-enter [animation-delay:120ms]'
        >
          <AccommodationBoard
            accommodations={accommodations}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isLoading={accLoading}
            isError={accError}
            onRetry={() => void refetchAcc()}
          />
        </div>

        {/* Section 4: 최근 이벤트 */}
        <div className='animate-dashboard-enter [animation-delay:180ms]'>
          <RecentEvents
            events={recentLogs}
            isLoading={logsLoading}
            isError={logsError}
            onRetry={() => void refetchLogs()}
          />
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Header
/**
 * Render the dashboard page header with the page title and subtitle.
 *
 * @returns A React element containing the dashboard title and descriptive subtitle.
 */

function Header(): React.ReactElement {
  return (
    <header className='mb-6'>
      <h1 className='text-2xl font-semibold leading-[1.2] text-foreground md:text-3xl'>{PAGE_TITLE}</h1>
      <p className='mt-2 text-sm leading-normal text-muted-foreground'>{PAGE_SUBTITLE}</p>
    </header>
  );
}

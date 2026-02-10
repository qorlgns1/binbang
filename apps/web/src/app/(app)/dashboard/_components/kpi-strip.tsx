import { Activity, AlertTriangle, Building2, Gauge } from 'lucide-react';

import { KPI_LABELS, QUOTA_NULL_DESCRIPTION, QUOTA_NULL_VALUE } from '@/app/(app)/dashboard/_lib/constants';
import type { DashboardMetrics } from '@/app/(app)/dashboard/_lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { SectionSkeleton } from './section-skeleton';

interface KpiStripProps {
  metrics: DashboardMetrics;
  isLoading: boolean;
}

export function KpiStrip({ metrics, isLoading }: KpiStripProps): React.ReactElement {
  if (isLoading) {
    return <SectionSkeleton variant='kpi' />;
  }

  const quotaDisplay = getQuotaDisplay(metrics.quotaPercent);
  const quotaColorClass = getQuotaColorClass(metrics.quotaRatio);
  const quotaAccent = getQuotaAccent(metrics.quotaRatio);

  const items: KpiItemData[] = [
    {
      label: KPI_LABELS.total,
      value: metrics.totalCount.toLocaleString('ko-KR'),
      colorClass: 'text-foreground',
      accentClass: 'border-l-primary',
      iconBgClass: 'bg-primary/10',
      iconColorClass: 'text-primary',
      icon: Building2,
    },
    {
      label: KPI_LABELS.active,
      value: metrics.activeCount.toLocaleString('ko-KR'),
      colorClass: 'text-foreground',
      accentClass: 'border-l-chart-3',
      iconBgClass: 'bg-chart-3/10',
      iconColorClass: 'text-chart-3',
      icon: Activity,
    },
    {
      label: KPI_LABELS.problem,
      value: metrics.problemCount.toLocaleString('ko-KR'),
      colorClass: metrics.problemCount > 0 ? 'text-destructive' : 'text-foreground',
      accentClass: metrics.problemCount > 0 ? 'border-l-destructive' : 'border-l-border',
      iconBgClass: metrics.problemCount > 0 ? 'bg-destructive/10' : 'bg-muted',
      iconColorClass: metrics.problemCount > 0 ? 'text-destructive' : 'text-muted-foreground',
      icon: AlertTriangle,
      description: metrics.problemCount > 0 ? '점검이 필요합니다' : undefined,
      showPulse: metrics.problemCount > 0,
    },
    {
      label: KPI_LABELS.quota,
      value: quotaDisplay.value,
      colorClass: quotaColorClass,
      accentClass: quotaAccent.accent,
      iconBgClass: quotaAccent.iconBg,
      iconColorClass: quotaAccent.iconColor,
      icon: Gauge,
      description: quotaDisplay.description,
      progress: metrics.quotaPercent,
      progressColorClass: quotaAccent.progressColor,
    },
  ];

  return (
    <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4'>
      {items.map((item) => (
        <KpiCard
          key={item.label}
          {...item}
        />
      ))}
    </div>
  );
}

// ============================================================================
// KPI Card
// ============================================================================

interface KpiItemData {
  label: string;
  value: string;
  colorClass: string;
  accentClass: string;
  iconBgClass: string;
  iconColorClass: string;
  icon: React.ElementType;
  description?: string;
  showPulse?: boolean;
  progress?: number | null;
  progressColorClass?: string;
}

function KpiCard({
  label,
  value,
  colorClass,
  accentClass,
  iconBgClass,
  iconColorClass,
  icon: Icon,
  description,
  showPulse,
  progress,
  progressColorClass,
}: KpiItemData): React.ReactElement {
  return (
    <Card className={cn('border-l-4 transition-shadow duration-140 ease-out hover:shadow-md', accentClass)}>
      <CardContent className='flex min-h-[104px] items-center gap-4 pt-6'>
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', iconBgClass)}>
          <Icon className={cn('size-5', iconColorClass)} />
        </div>
        <div className='flex flex-1 flex-col gap-1'>
          <p className='text-sm font-medium leading-[1.4] text-muted-foreground'>{label}</p>
          <div className='flex items-center gap-2'>
            <p className={cn('text-2xl font-semibold leading-[1.2] md:text-3xl', colorClass)}>{value}</p>
            {showPulse && (
              <span className='relative flex size-2.5'>
                <span className='absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75' />
                <span className='relative inline-flex size-2.5 rounded-full bg-destructive' />
              </span>
            )}
          </div>
          {description && <p className='text-xs leading-[1.4] text-muted-foreground'>{description}</p>}
          {progress !== undefined && progress !== null && (
            <div className='mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted'>
              <div
                className={cn('h-full rounded-full transition-all', progressColorClass)}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function getQuotaDisplay(quotaPercent: number | null): { value: string; description?: string } {
  if (quotaPercent === null) {
    return { value: QUOTA_NULL_VALUE, description: QUOTA_NULL_DESCRIPTION };
  }
  return { value: `${quotaPercent}%` };
}

function getQuotaColorClass(quotaRatio: number | null): string {
  if (quotaRatio === null) return 'text-muted-foreground';
  if (quotaRatio >= 1.0) return 'text-destructive';
  if (quotaRatio >= 0.8) return 'text-chart-1';
  return 'text-foreground';
}

function getQuotaAccent(quotaRatio: number | null): {
  accent: string;
  iconBg: string;
  iconColor: string;
  progressColor: string;
} {
  if (quotaRatio === null) {
    return {
      accent: 'border-l-border',
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
      progressColor: 'bg-muted-foreground',
    };
  }
  if (quotaRatio >= 1.0) {
    return {
      accent: 'border-l-destructive',
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      progressColor: 'bg-destructive',
    };
  }
  if (quotaRatio >= 0.8) {
    return {
      accent: 'border-l-chart-1',
      iconBg: 'bg-chart-1/10',
      iconColor: 'text-chart-1',
      progressColor: 'bg-chart-1',
    };
  }
  return {
    accent: 'border-l-primary',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    progressColor: 'bg-primary',
  };
}

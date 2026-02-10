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

/**
 * Render a responsive strip of four KPI cards or a loading skeleton.
 *
 * Renders a SectionSkeleton with variant `'kpi'` when loading; otherwise computes display values and styling from `metrics` and returns a responsive grid of KPI cards for total, active, problem, and quota metrics.
 *
 * @param metrics - Dashboard metrics used to populate each KPI card (totalCount, activeCount, problemCount, quotaPercent, quotaRatio, etc.)
 * @param isLoading - When true, show a KPI skeleton instead of the KPI cards
 * @returns A React element containing either the KPI skeleton (if `isLoading`) or a responsive grid of KPI cards populated from `metrics`
 */
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

/**
 * Render a KPI card displaying an icon, label, value, and optional description, pulse indicator, and progress bar.
 *
 * @param showPulse - When `true`, display a pulsing indicator next to the value.
 * @param progress - Optional progress percentage (0–100). When provided, a progress bar is shown and its width is clamped to 100%.
 * @param progressColorClass - CSS class applied to the progress fill element.
 * @param accentClass - CSS class applied to the card's left accent border.
 * @param iconBgClass - CSS class applied to the icon background container.
 * @param iconColorClass - CSS class applied to the icon itself.
 * @returns A React element representing the styled KPI card.
 */
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
/**
 * Format a quota percentage for display, providing a fallback description when the quota is unavailable.
 *
 * @param quotaPercent - Quota percentage as a number (e.g., `75`) or `null` if the quota is unavailable.
 * @returns An object with `value` containing the display string (e.g., `"75%"` or a null placeholder) and, when `quotaPercent` is `null`, a `description` explaining the missing quota.
 */

function getQuotaDisplay(quotaPercent: number | null): { value: string; description?: string } {
  if (quotaPercent === null) {
    return { value: QUOTA_NULL_VALUE, description: QUOTA_NULL_DESCRIPTION };
  }
  return { value: `${quotaPercent}%` };
}

/**
 * Chooses a text color utility class that reflects the quota usage level.
 *
 * @param quotaRatio - The quota ratio (used ÷ limit), or `null` when the ratio is unavailable
 * @returns `'text-muted-foreground'` if `quotaRatio` is `null`, `'text-destructive'` if `quotaRatio` is greater than or equal to 1.0, `'text-chart-1'` if `quotaRatio` is greater than or equal to 0.8, and `'text-foreground'` otherwise
 */
function getQuotaColorClass(quotaRatio: number | null): string {
  if (quotaRatio === null) return 'text-muted-foreground';
  if (quotaRatio >= 1.0) return 'text-destructive';
  if (quotaRatio >= 0.8) return 'text-chart-1';
  return 'text-foreground';
}

/**
 * Selects CSS utility classes for quota-related visuals based on the quota ratio.
 *
 * @param quotaRatio - The quota usage ratio as a fraction (e.g., 0.75). Use `null` when the quota is unknown.
 * @returns An object containing CSS class names:
 *  - `accent`: left-border accent class
 *  - `iconBg`: icon background class
 *  - `iconColor`: icon color class
 *  - `progressColor`: progress bar color class
 *
 * The returned classes reflect these states:
 *  - `quotaRatio === null` → muted styling
 *  - `quotaRatio >= 1.0` → destructive (over quota) styling
 *  - `quotaRatio >= 0.8` → warning (near quota) styling
 *  - otherwise → primary (normal) styling
 */
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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminFunnelGrowthKpis } from '@/types/admin';

const GROWTH_ITEMS: Array<{
  key: keyof AdminFunnelGrowthKpis;
  label: string;
  alias: string;
  format?: 'ratio';
}> = [
  { key: 'organicVisit', label: '오가닉 유입', alias: 'organic_landing' },
  { key: 'availabilityCtaClick', label: '가용성 CTA 클릭', alias: 'availability_cta' },
  { key: 'signupCompleted', label: '회원가입 완료', alias: 'signup_completed' },
  { key: 'firstAlertCreated', label: '첫 알림 생성 (고유 사용자)', alias: 'first_alert_created' },
  { key: 'totalAlertsCreated', label: '총 알림 생성 수', alias: 'total_alerts_created' },
  { key: 'alertsPerUser', label: '사용자당 알림 수', alias: 'alerts_per_user', format: 'ratio' },
];

interface GrowthKpiCardsProps {
  kpis: AdminFunnelGrowthKpis;
}

function formatKpiValue(value: number, format?: 'ratio'): string {
  if (format === 'ratio') return value.toFixed(1);
  return String(value);
}

export function GrowthKpiCards({ kpis }: GrowthKpiCardsProps) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
      {GROWTH_ITEMS.map((item) => (
        <Card key={item.key} className='animate-dashboard-enter'>
          <CardHeader className='pb-2'>
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className='text-3xl'>{formatKpiValue(kpis[item.key], item.format)}</CardTitle>
          </CardHeader>
          <CardContent className='text-xs text-muted-foreground'>{item.alias}</CardContent>
        </Card>
      ))}
    </div>
  );
}

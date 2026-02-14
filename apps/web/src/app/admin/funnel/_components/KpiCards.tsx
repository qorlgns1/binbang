import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminFunnelKpis } from '@/types/admin';

const KPI_ITEMS: Array<{ key: keyof AdminFunnelKpis; label: string; alias: string }> = [
  { key: 'submitted', label: '제출', alias: 'submitted' },
  { key: 'processed', label: '처리', alias: 'processed' },
  { key: 'paymentConfirmed', label: '결제 확인', alias: 'paymentConfirmed' },
  { key: 'conditionMet', label: '조건 충족', alias: 'conditionMet' },
];

interface KpiCardsProps {
  kpis: AdminFunnelKpis;
}

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'>
      {KPI_ITEMS.map((item) => (
        <Card key={item.key} className='animate-dashboard-enter'>
          <CardHeader className='pb-2'>
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className='text-3xl'>{kpis[item.key]}</CardTitle>
          </CardHeader>
          <CardContent className='text-xs text-muted-foreground'>{item.alias}</CardContent>
        </Card>
      ))}
    </div>
  );
}

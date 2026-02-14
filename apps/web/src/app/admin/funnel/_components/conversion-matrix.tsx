import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminFunnelConversion } from '@/types/admin';

interface ConversionMatrixProps {
  conversion: AdminFunnelConversion;
}

function toPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

const CONVERSION_ITEMS: Array<{ key: keyof AdminFunnelConversion; label: string }> = [
  { key: 'submittedToProcessed', label: '제출 → 처리' },
  { key: 'processedToPaymentConfirmed', label: '처리 → 결제 확인' },
  { key: 'paymentConfirmedToConditionMet', label: '결제 확인 → 조건 충족' },
  { key: 'submittedToConditionMet', label: '제출 → 조건 충족' },
];

export function ConversionMatrix({ conversion }: ConversionMatrixProps) {
  return (
    <Card className='animate-dashboard-enter'>
      <CardHeader>
        <CardTitle>전환율</CardTitle>
      </CardHeader>
      <CardContent className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
        {CONVERSION_ITEMS.map((item) => (
          <div key={item.key} className='rounded-md border p-3 flex items-center justify-between'>
            <span className='text-muted-foreground'>{item.label}</span>
            <span className='font-medium'>{toPercent(conversion[item.key])}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

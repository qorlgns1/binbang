import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminFunnelGrowthConversion } from '@/types/admin';

interface GrowthConversionMatrixProps {
  conversion: AdminFunnelGrowthConversion;
}

function toPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

const CONVERSION_ITEMS: Array<{ key: keyof AdminFunnelGrowthConversion; label: string }> = [
  { key: 'visitToSignup', label: '오가닉 유입 → 가입 완료' },
  { key: 'signupToAlert', label: '가입 완료 → 첫 알림 생성' },
  { key: 'visitToAlert', label: '오가닉 유입 → 첫 알림 생성' },
  { key: 'ctaToSignup', label: '가용성 CTA → 가입 완료' },
];

export function GrowthConversionMatrix({ conversion }: GrowthConversionMatrixProps) {
  return (
    <Card className='animate-dashboard-enter'>
      <CardHeader>
        <CardTitle>성장 전환율</CardTitle>
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

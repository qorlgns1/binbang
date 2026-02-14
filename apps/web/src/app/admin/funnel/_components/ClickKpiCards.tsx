import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminFunnelClickTotals } from '@/types/admin';

const CLICK_ITEMS: Array<{ key: keyof AdminFunnelClickTotals; label: string; alias: string }> = [
  { key: 'navSignup', label: '네비 가입 클릭', alias: 'nav_signup' },
  { key: 'navRequest', label: '요청 클릭', alias: 'nav_request' },
  { key: 'navPricing', label: '요금제 클릭', alias: 'nav_pricing' },
  { key: 'mobileMenuOpen', label: '모바일 메뉴 오픈', alias: 'mobile_menu_open' },
  { key: 'mobileMenuCta', label: '모바일 메뉴 CTA', alias: 'mobile_menu_cta' },
  { key: 'total', label: '총 클릭', alias: 'total' },
];

interface ClickKpiCardsProps {
  totals: AdminFunnelClickTotals;
}

export function ClickKpiCards({ totals }: ClickKpiCardsProps) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
      {CLICK_ITEMS.map((item) => (
        <Card key={item.key}>
          <CardHeader className='pb-2'>
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className='text-3xl'>{totals[item.key]}</CardTitle>
          </CardHeader>
          <CardContent className='text-xs text-muted-foreground'>{item.alias}</CardContent>
        </Card>
      ))}
    </div>
  );
}

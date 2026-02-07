import Link from 'next/link';

import { ShieldCheck, Timer, WavesLadder } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AuthBrandPanelProps {
  ctaLabel?: string;
  ctaHref?: string;
}

export function AuthBrandPanel({ ctaLabel, ctaHref }: AuthBrandPanelProps) {
  return (
    <aside className='relative h-full overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-7 shadow-sm'>
      <div className='pointer-events-none absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent' />

      <div className='relative z-10 flex h-full flex-col justify-center space-y-5'>
        <Badge className='border-primary/40 bg-primary/10 text-primary'>Lighthouse Signal</Badge>

        <div>
          <p className='text-sm text-muted-foreground'>빈방어때</p>
          <h2 className='mt-2 text-2xl font-semibold leading-tight text-foreground md:text-3xl'>
            당신의 휴식이 길을 잃지 않도록,
            <br />
            밤새 길을 비춥니다.
          </h2>
          <p className='mt-3 text-sm leading-relaxed text-muted-foreground'>
            복잡한 모니터링은 시스템이 맡고, 당신은 결과만 편하게 확인하세요.
          </p>
        </div>

        <ul className='space-y-3 text-sm text-muted-foreground'>
          <li className='flex items-start gap-3'>
            <span className='mt-0.5 inline-flex size-6 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary'>
              <Timer className='size-4' />
            </span>
            <span>브라우저 최적화 체크로 더 빠르게 빈자리를 포착합니다.</span>
          </li>
          <li className='flex items-start gap-3'>
            <span className='mt-0.5 inline-flex size-6 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary'>
              <WavesLadder className='size-4' />
            </span>
            <span>플랫폼 UI가 바뀌어도 동적 셀렉터로 안정적으로 대응합니다.</span>
          </li>
          <li className='flex items-start gap-3'>
            <span className='mt-0.5 inline-flex size-6 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary'>
              <ShieldCheck className='size-4' />
            </span>
            <span>하트비트 기반 상태 점검으로 모니터링 신뢰성을 유지합니다.</span>
          </li>
        </ul>

        {ctaLabel && ctaHref ? (
          <Button
            asChild
            variant='outline'
            className='border-primary/40 bg-background/70 text-primary hover:bg-primary/10'
          >
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        ) : null}
      </div>
    </aside>
  );
}

import Image from 'next/image';

import { Anchor, Target, Zap } from 'lucide-react';

import type { LandingCopy } from '@/lib/i18n/landing';

interface FeaturesProps {
  copy: LandingCopy;
}

const FEATURE_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1552858725-2758b5fb1286?auto=format&fit=crop&w=1400&q=80',
    alt: '빠른 속도 - 1분마다 자동으로 체크하는 실시간 모니터링',
  },
  {
    url: 'https://images.unsplash.com/photo-1536125434175-6c5657605fb0?auto=format&fit=crop&w=1400&q=80',
    alt: '정확한 추적 - 사이트 변경에도 대응하는 동적 셀렉터',
  },
  {
    url: 'https://images.unsplash.com/photo-1610029795220-e5afca4dc7ba?auto=format&fit=crop&w=1400&q=80',
    alt: '안정적인 운영 - 24시간 하트비트 모니터링',
  },
] as const;

export function Features({ copy }: FeaturesProps): React.ReactElement {
  const items = [
    {
      icon: <Zap className='size-8 text-primary' />,
      title: copy.features.f1Title,
      subtitle: copy.features.f1Subtitle,
      description: copy.features.f1Desc,
      image: FEATURE_IMAGES[0].url,
      imageAlt: FEATURE_IMAGES[0].alt,
    },
    {
      icon: <Target className='size-8 text-primary' />,
      title: copy.features.f2Title,
      subtitle: copy.features.f2Subtitle,
      description: copy.features.f2Desc,
      image: FEATURE_IMAGES[1].url,
      imageAlt: FEATURE_IMAGES[1].alt,
    },
    {
      icon: <Anchor className='size-8 text-primary' />,
      title: copy.features.f3Title,
      subtitle: copy.features.f3Subtitle,
      description: copy.features.f3Desc,
      image: FEATURE_IMAGES[2].url,
      imageAlt: FEATURE_IMAGES[2].alt,
    },
  ];

  return (
    <section
      id='features'
      className='bg-background px-4 py-24'
    >
      <div className='mx-auto grid w-full max-w-7xl gap-6 md:grid-cols-3'>
        {items.map((item) => (
          <article
            key={item.title}
            className='group relative h-auto min-h-[420px] overflow-hidden rounded-2xl border border-border bg-card/50 transition-transform duration-500 ease-out hover:-translate-y-0.5 md:h-[480px]'
          >
            <Image
              src={item.image}
              alt={item.imageAlt}
              fill
              className='object-cover opacity-0 grayscale transition-all duration-500 ease-out group-hover:scale-[1.08] group-hover:opacity-25 group-hover:grayscale-0'
              sizes='(max-width: 768px) 100vw, 33vw'
            />

            <div className='relative z-10 flex h-full flex-col p-7'>
              <div className='mb-5 w-fit rounded-lg border border-border bg-background/70 p-3'>{item.icon}</div>
              <h3 className='text-2xl font-semibold leading-snug text-foreground'>{item.title}</h3>
              <p className='mt-2 text-sm font-medium italic text-primary/80'>{item.subtitle}</p>
              <p className='mt-4 leading-relaxed text-muted-foreground'>{item.description}</p>
              <p className='mt-auto text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100'>
                {copy.features.learnMore}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

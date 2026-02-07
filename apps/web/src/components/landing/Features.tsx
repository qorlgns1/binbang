import Image from 'next/image';

import { Anchor, Target, Zap } from 'lucide-react';

import type { LandingCopy } from './landing-data';

interface FeaturesProps {
  copy: LandingCopy;
}

const FEATURE_IMAGES = [
  'https://images.unsplash.com/photo-1552858725-2758b5fb1286?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1536125434175-6c5657605fb0?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1610029795220-e5afca4dc7ba?auto=format&fit=crop&w=1400&q=80',
] as const;

export function Features({ copy }: FeaturesProps): React.ReactElement {
  const items = [
    {
      icon: <Zap className='size-8 text-primary' />,
      title: copy.features.f1Title,
      description: copy.features.f1Desc,
      image: FEATURE_IMAGES[0],
    },
    {
      icon: <Target className='size-8 text-primary' />,
      title: copy.features.f2Title,
      description: copy.features.f2Desc,
      image: FEATURE_IMAGES[1],
    },
    {
      icon: <Anchor className='size-8 text-primary' />,
      title: copy.features.f3Title,
      description: copy.features.f3Desc,
      image: FEATURE_IMAGES[2],
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
            className='group relative h-[380px] overflow-hidden rounded-2xl border border-border bg-card/50'
          >
            <Image
              src={item.image}
              alt=''
              fill
              className='object-cover opacity-0 grayscale transition-all duration-500 group-hover:scale-110 group-hover:opacity-25 group-hover:grayscale-0'
              sizes='(max-width: 768px) 100vw, 33vw'
            />

            <div className='relative z-10 flex h-full flex-col p-7'>
              <div className='mb-5 w-fit rounded-lg border border-border bg-background/70 p-3'>{item.icon}</div>
              <h3 className='text-2xl font-semibold leading-snug text-foreground'>{item.title}</h3>
              <p className='mt-4 text-muted-foreground'>{item.description}</p>
              <p className='mt-auto text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100'>
                Learn more
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { trackClickEvent } from '@/lib/analytics/clickTracker';
import type { Locale } from '@workspace/shared/i18n';

interface AvailabilityCtaButtonProps {
  lang: Locale;
  href: string;
  source: string;
  label: string;
  className?: string;
}

export function AvailabilityCtaButton({
  lang,
  href,
  source,
  label,
  className,
}: AvailabilityCtaButtonProps): React.ReactElement {
  const handleClick = (): void => {
    trackClickEvent({
      eventName: 'availability_cta',
      source,
      locale: lang,
    });
  };

  const handleHover = (): void => {
    trackClickEvent({
      eventName: 'availability_cta_hover',
      source: `${source}_hover`,
      locale: lang,
    });
  };

  return (
    <Button asChild className={className}>
      <Link href={href} onClick={handleClick} onMouseEnter={handleHover}>
        {label}
      </Link>
    </Button>
  );
}

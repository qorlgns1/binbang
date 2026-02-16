'use client';

import { useEffect } from 'react';

import { trackClickEvent } from '@/lib/analytics/clickTracker';
import type { Locale } from '@workspace/shared/i18n';

interface AvailabilityPageViewTrackerProps {
  lang: Locale;
  propertyName: string;
  platform: string;
}

export function AvailabilityPageViewTracker({ lang, propertyName, platform }: AvailabilityPageViewTrackerProps): null {
  useEffect(() => {
    trackClickEvent({
      eventName: 'availability_page_view',
      source: `${platform}_${propertyName}`,
      locale: lang,
    });
  }, [lang, propertyName, platform]);

  return null;
}

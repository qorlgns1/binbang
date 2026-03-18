import { createNavigation } from 'next-intl/navigation';

import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@workspace/shared/i18n';

export const { usePathname, useRouter } = createNavigation({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed',
});

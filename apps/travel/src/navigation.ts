import { createNavigation } from 'next-intl/navigation';

import { defaultLocale, locales } from '@/i18n';

export const { usePathname, useRouter } = createNavigation({ locales, defaultLocale, localePrefix: 'as-needed' });

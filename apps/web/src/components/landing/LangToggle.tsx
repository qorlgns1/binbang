'use client';

import { usePathname, useRouter } from 'next/navigation';

import { Globe } from 'lucide-react';

import { trackLocaleToggled } from '@/lib/analytics/landing-tracker';
import { SUPPORTED_LOCALES, type Locale } from '@workspace/shared/i18n';
import { cn } from '@/lib/utils';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LangToggleProps {
  currentLang: Locale;
  className?: string;
  variant?: 'desktop' | 'mobile';
}

/** Public pathname의 locale prefix (SUPPORTED_LOCALES와 동기화) */
const LOCALE_PATH_REGEX = /^\/(ko|en|ja|zh-CN|es-419)(\/.*)?$/;

/** 언어 선택 시 트리거/옵션에 표시할 짧은 라벨 */
const LOCALE_LABELS: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  'zh-CN': '简体中文',
  'es-419': 'Español',
};

/**
 * 5개국어(ko, en, ja, zh-CN, es-419) 선택 컨트롤.
 *
 * 선택 시 쿠키(`binbang-lang`) 저장, analytics 기록, Public이면 locale prefix만 교체해 이동, App이면 refresh.
 */
export function LangToggle({ currentLang, className = '', variant = 'desktop' }: LangToggleProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLang: string): void => {
    const locale = newLang as Locale;
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';

    // biome-ignore lint/suspicious/noDocumentCookie: language preference cookie for server-side locale routing
    document.cookie = `binbang-lang=${locale}; path=/; max-age=31536000`;

    trackLocaleToggled(locale, theme);

    const localeMatch = pathname.match(LOCALE_PATH_REGEX);
    if (localeMatch) {
      router.push(`/${locale}${localeMatch[2] || ''}`);
    } else {
      router.refresh();
    }
  };

  return (
    <Select value={currentLang} onValueChange={handleChange}>
      <SelectTrigger
        className={cn(
          'min-w-30 text-xs font-medium',
          variant === 'desktop' && 'rounded-full border-border px-3 py-2 hover:border-primary/60 hover:bg-primary/5 hover:text-primary',
          variant === 'mobile' && 'min-w-24 rounded-md px-2.5 py-1.5',
          className,
        )}
        aria-label="Select language"
      >
        {variant === 'desktop' && <Globe className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
        <SelectValue>{LOCALE_LABELS[currentLang]}</SelectValue>
      </SelectTrigger>
      <SelectContent className="z-100" position="popper">
        {SUPPORTED_LOCALES.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {LOCALE_LABELS[locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

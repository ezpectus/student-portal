'use client';

import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';

import { Link, LOCALE, usePathname } from '@/i18n/routing';

export const LocaleSwitch = () => {
  const locale = useLocale();
  const pathname = usePathname();
  const searchparams = useSearchParams();

  const localeOrder: LOCALE[] = [LOCALE.UK, LOCALE.EN, LOCALE.PL, LOCALE.DE];
  const currentIndex = localeOrder.indexOf(locale as LOCALE);
  const nextLocale = localeOrder[(currentIndex + 1) % localeOrder.length];

  const localeLabels: Record<string, string> = {
    uk: 'Українська',
    en: 'English',
    pl: 'Polski',
    de: 'Deutsch',
  };

  return (
    <Link
      href={{ pathname, search: searchparams.toString() }}
      locale={nextLocale}
      className="flex items-center gap-[6px] text-end"
    >
      <span className="hidden text-neutral-600 md:block">{localeLabels[nextLocale] ?? 'English'}</span>
      <span className="text-xs font-medium uppercase text-neutral-500">{nextLocale}</span>
    </Link>
  );
};

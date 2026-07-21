'use client';

import { Check, Languages } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, LOCALE, usePathname } from '@/i18n/routing';

export const LocaleSwitch = () => {
  const locale = useLocale();
  const pathname = usePathname();
  const searchparams = useSearchParams();

  const localeOrder: LOCALE[] = [LOCALE.UK, LOCALE.EN, LOCALE.PL, LOCALE.DE];

  const localeLabels: Record<string, string> = {
    uk: 'Українська',
    en: 'English',
    pl: 'Polski',
    de: 'Deutsch',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900">
        <Languages className="h-4 w-4" />
        <span className="hidden sm:inline">{localeLabels[locale] ?? 'English'}</span>
        <span className="text-xs font-semibold uppercase sm:hidden">{locale}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {localeOrder.map((loc) => (
          <DropdownMenuItem key={loc} asChild>
            <Link
              href={{ pathname, search: searchparams.toString() }}
              locale={loc}
              className="flex items-center justify-between gap-2"
            >
              {localeLabels[loc]}
              {loc === locale && <Check className="h-4 w-4" />}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

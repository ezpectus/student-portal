import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export enum LOCALE {
  UK = 'uk',
  EN = 'en',
  PL = 'pl',
  DE = 'de',
}

export const LOCALES = ['uk', 'en', 'pl', 'de'];

export const DEFAULT_LOCALE = 'uk';

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

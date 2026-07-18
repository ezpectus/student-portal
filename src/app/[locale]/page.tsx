import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';

import { getUserDetails } from '@/actions/auth.actions';
import { LocaleProps } from '@/types/locale-props';

export default async function LocaleRootPage({ params }: LocaleProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getUserDetails();

  if (user) {
    redirect(`/${locale}/dashboard`);
  }

  redirect(`/${locale}/landing`);
}

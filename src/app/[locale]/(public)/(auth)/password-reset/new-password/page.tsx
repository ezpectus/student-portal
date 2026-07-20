import { getTranslations, setRequestLocale } from 'next-intl/server';

import { env } from '@/lib/env';
import { LocaleProps } from '@/types/locale-props';

import { AuthNavLayout } from '../../../auth-nav-layout';
import { LocalPasswordResetForm } from '../local-reset-form';

const INTL_NAMESPACE = 'auth.passwordReset';

export async function generateMetadata({ params }: LocaleProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: INTL_NAMESPACE });
  return { title: t('header') };
}

export default async function LocalResetPage({ params }: LocaleProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations(INTL_NAMESPACE);

  if (env.NEXT_PUBLIC_LOCAL_AUTH !== 'true') {
    return null;
  }

  return (
    <AuthNavLayout header={t('set-new-password')} description={t('set-new-password-description')}>
      <LocalPasswordResetForm />
    </AuthNavLayout>
  );
}

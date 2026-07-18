import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Description,Heading2 } from '@/components/typography';
import { Link } from '@/i18n/routing';
import { LocaleProps } from '@/types/locale-props';

import { CredentialsLogin } from './credentials-login';

const INTL_NAMESPACE = 'auth.login';

export async function generateMetadata({ params }: LocaleProps) {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: INTL_NAMESPACE });

  return {
    title: t('header'),
  };
}

export default async function LoginPage({ params }: LocaleProps) {
  const { locale } = await params;

  setRequestLocale(locale);

  const t = await getTranslations(INTL_NAMESPACE);

  return (
    <>
      <Heading2>{t('header')}</Heading2>
      <Description>{t('description')}</Description>
      <CredentialsLogin />
      <Link className="mt-4 text-sm" href="/register">
        {t('register')}
      </Link>
    </>
  );
}

import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Description,Heading2 } from '@/components/typography';
import { LocaleProps } from '@/types/locale-props';

import { RegisterForm } from './register-form';

const INTL_NAMESPACE = 'auth.register';

export async function generateMetadata({ params }: LocaleProps) {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: INTL_NAMESPACE });

  return {
    title: t('header'),
  };
}

export default async function RegisterPage({ params }: LocaleProps) {
  const { locale } = await params;

  setRequestLocale(locale);

  const t = await getTranslations(INTL_NAMESPACE);

  return (
    <>
      <Heading2>{t('header')}</Heading2>
      <Description>{t('description')}</Description>
      <RegisterForm />
    </>
  );
}

import { getTranslations, setRequestLocale } from 'next-intl/server';

import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import { Description, Heading2 } from '@/components/typography';
import { LocaleProps } from '@/types/locale-props';

const INTL_NAMESPACE = 'private.onboarding';

export async function generateMetadata({ params }: LocaleProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: INTL_NAMESPACE });
  return {
    title: t('title'),
  };
}

export default async function OnboardingPage({ params }: LocaleProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations(INTL_NAMESPACE);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <Heading2>{t('title')}</Heading2>
      <Description className="mb-8">{t('subtitle')}</Description>
      <OnboardingWizard />
    </div>
  );
}

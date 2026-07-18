import { getMonitoringById } from '@/actions/monitoring.actions';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LocaleProps } from '@/types/locale-props';
import { StudySheetContent } from '@/app/[locale]/(private)/module/studysheet/[id]/page.content';
import { LoadingScreen } from '@/components/loading-screen';

const INTL_NAMESPACE = 'private.study-sheet';

interface Props extends LocaleProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: INTL_NAMESPACE });
  return {
    title: t('title'),
  };
}

export default async function InfoPage({ params }: Props) {
  const { id, locale } = await params;
  setRequestLocale(locale);

  const creditModule = await getMonitoringById(id);

  if (!creditModule) {
    return <LoadingScreen />;
  }

  return <StudySheetContent creditModule={creditModule} />;
}

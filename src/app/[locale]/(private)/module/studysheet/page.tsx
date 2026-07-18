import { getMonitoring } from '@/actions/monitoring.actions';
import { StudySheetContent } from '@/app/[locale]/(private)/module/studysheet/components/study-sheet-content';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LocaleProps } from '@/types/locale-props';

export async function generateMetadata({ params }: LocaleProps) {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: 'private.study-sheet' });

  return {
    title: t('title'),
  };
}

export default async function StudySheetPage({ params }: LocaleProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sheet = await getMonitoring();

  return <StudySheetContent sheet={sheet} />;
}

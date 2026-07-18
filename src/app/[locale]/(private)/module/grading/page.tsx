import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getTeacherCourses } from '@/actions/grading.actions';
import { LocaleProps } from '@/types/locale-props';

import { GradingView } from './components/grading-view';

const INTL_NAMESPACE = 'private.grading';

export async function generateMetadata({ params }: LocaleProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: INTL_NAMESPACE });
  return { title: t('title') };
}

export default async function GradingPage({ params }: LocaleProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations(INTL_NAMESPACE);
  const courses = await getTeacherCourses();

  return <GradingView courses={courses} emptyMessage={t('empty')} />;
}

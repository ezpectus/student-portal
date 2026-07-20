import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getEvents } from '@/actions/calendar.actions';
import { SubLayout } from '@/app/[locale]/(private)/sub-layout';
import { LocaleProps } from '@/types/locale-props';

import { CalendarView } from './components/calendar-view';

const INTL_NAMESPACE = 'private.calendar';

export async function generateMetadata({ params }: LocaleProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: INTL_NAMESPACE });
  return { title: t('title') };
}

export default async function CalendarPage({ params }: LocaleProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations(INTL_NAMESPACE);
  const events = await getEvents();

  return (
    <SubLayout pageTitle={t('title')}>
      <div className="col-span-12">
        <CalendarView events={events} />
      </div>
    </SubLayout>
  );
}

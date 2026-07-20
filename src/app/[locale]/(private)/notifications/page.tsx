import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getNotifications } from '@/actions/notification.actions';
import { SubLayout } from '@/app/[locale]/(private)/sub-layout';
import { LocaleProps } from '@/types/locale-props';

import { NotificationsPage } from './components/notifications-page';

const INTL_NAMESPACE = 'private.notifications';
const PAGE_SIZE = 20;

export async function generateMetadata({ params }: LocaleProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: INTL_NAMESPACE });
  return { title: t('page-title') };
}

export default async function NotificationsRoute({ params }: LocaleProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations(INTL_NAMESPACE);
  const { items, unreadCount, total } = await getNotifications(1, PAGE_SIZE);

  return (
    <SubLayout pageTitle={t('page-title')}>
      <div className="col-span-12">
        <NotificationsPage
          initialItems={items}
          initialUnreadCount={unreadCount}
          total={total}
          pageSize={PAGE_SIZE}
        />
      </div>
    </SubLayout>
  );
}

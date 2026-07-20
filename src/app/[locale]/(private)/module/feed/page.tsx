import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { getLocalUserLite } from '@/actions/local-user.actions';

import { FeedContent } from './components/feed-content';

const INTL_NAMESPACE = 'private.feed';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: INTL_NAMESPACE });
  return { title: t('title') };
}

export default async function FeedPage() {
  const user = await getLocalUserLite();
  return <FeedContent currentUserId={user?.id ?? 0} isAdmin={user?.role === 'ADMIN'} />;
}

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ChatContent } from './components/chat-content';

const INTL_NAMESPACE = 'private.chat';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: INTL_NAMESPACE });
  return { title: t('title') };
}

export default function ChatPage() {
  return <ChatContent />;
}

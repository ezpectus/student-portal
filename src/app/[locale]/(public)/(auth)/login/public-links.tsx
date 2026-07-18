import { getTranslations } from 'next-intl/server';

import { Chats,LifebuoyOutline, Student } from '@/app/images';
import { env } from '@/lib/env';

import { PublicLink } from './public-link';

export const PublicLinks = async () => {
  const t = await getTranslations('auth.login.publicLink');
  const suggestionsUrl = env.NEXT_PUBLIC_SUGGESTIONS_FORM;
  const whatsappUrl = env.NEXT_PUBLIC_WHATSAPP_SUPPORT_LINK;

  return (
    <div className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-3">
      {suggestionsUrl && (
        <PublicLink target="_blank" href={suggestionsUrl} icon={<LifebuoyOutline />}>
          {t('support')}
        </PublicLink>
      )}
      <PublicLink href="/curator-search" icon={<Student />}>
        {t('curator-search')}
      </PublicLink>
      {whatsappUrl && (
        <PublicLink href={whatsappUrl} target="_blank" icon={<Chats />}>
          {t('chat')}
        </PublicLink>
      )}
    </div>
  );
};

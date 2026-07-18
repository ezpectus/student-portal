import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ChatsTeardrop, EnvelopeSimple } from '@/app/images';
import { Heading2, Heading3 } from '@/components/typography/headers';
import RichText from '@/components/typography/rich-text';
import { TextButton } from '@/components/ui/text-button';
import { Link } from '@/i18n/routing';
import { env } from '@/lib/env';
import { LocaleProps } from '@/types/locale-props';

import { SubLayout } from '../sub-layout';

const INTL_NAMESPACE = 'private.contacts';

export async function generateMetadata({ params }: LocaleProps) {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: INTL_NAMESPACE });

  return {
    title: t('title'),
  };
}

export default async function ContactsPage({ params }: LocaleProps) {
  const { locale } = await params;

  setRequestLocale(locale);

  const t = await getTranslations(INTL_NAMESPACE);
  const addressUrl = env.NEXT_PUBLIC_ADDRESS_URL;
  const githubUrl = env.NEXT_PUBLIC_GITHUB_URL;
  const facebookUrl = env.NEXT_PUBLIC_FACEBOOK_URL;
  const twitterUrl = env.NEXT_PUBLIC_TWITTER_URL;
  const instagramUrl = env.NEXT_PUBLIC_INSTAGRAM_URL;
  const suggestionsUrl = env.NEXT_PUBLIC_SUGGESTIONS_FORM;

  return (
    <SubLayout pageTitle={t('title')}>
      <div className="col-span-6">
        <Heading2>{t('title')}</Heading2>
        <RichText>
          {(tags) =>
            t.rich('content', {
              ...tags,
              h3: (chunks) => <Heading3 className="mt-14">{chunks}</Heading3>,
              addresslink: (chunks) => addressUrl && (
                <Link href={addressUrl} target="_blank" rel="noopener noreferrer">
                  {chunks}
                </Link>
              ),
              githublink: (chunks) => githubUrl && (
                <Link href={githubUrl} target="_blank" rel="noopener noreferrer">
                  {chunks}
                </Link>
              ),
              facebooklink: (chunks) => facebookUrl && (
                <Link href={facebookUrl} target="_blank" rel="noopener noreferrer">
                  {chunks}
                </Link>
              ),
              twitterlink: (chunks) => twitterUrl && (
                <Link href={twitterUrl} target="_blank" rel="noopener noreferrer">
                  {chunks}
                </Link>
              ),
              instagramlink: (chunks) => instagramUrl && (
                <Link href={instagramUrl} target="_blank" rel="noopener noreferrer">
                  {chunks}
                </Link>
              ),
              suggestionslink: (chunks) => suggestionsUrl && (
                <TextButton size="huge" href={suggestionsUrl} icon={<ChatsTeardrop />}>
                  {chunks}
                </TextButton>
              ),
              emaillink: (chunks) => (
                <TextButton size="huge" href="mailto:support@student-portal.app" icon={<EnvelopeSimple />}>
                  {chunks}
                </TextButton>
              ),
            })
          }
        </RichText>
      </div>
    </SubLayout>
  );
}

import { getTranslations } from 'next-intl/server';

import { Heading4 } from '@/components/typography/headers';
import RichText from '@/components/typography/rich-text';
import { Link } from '@/i18n/routing';
import { env } from '@/lib/env';

interface FrequentlyAskedQuestionsProps {
  i18nNamespace: string;
  sections: string[];
}

export const FrequentlyAskedQuestions = async ({ i18nNamespace, sections }: FrequentlyAskedQuestionsProps) => {
  const t = await getTranslations(i18nNamespace);
  const documentUrl = env.NEXT_PUBLIC_CAMPUS_DOCUMENT_TEMPLATE;

  return (
    <>
      {sections.map((section) => {
        const header = t(`sections.${section}.header`);
        const content = (
          <RichText>
            {(tags) =>
              t.rich(`sections.${section}.content`, {
                ...tags,
                documentlink: (chunks) => documentUrl && (
                  <Link href={documentUrl} target="_blank" rel="noopener noreferrer">
                    {chunks}
                  </Link>
                ),
                curatorlink: (chunks) => <Link href="/curator-search">{chunks}</Link>,
                restorepasswordlink: (chunks) => <Link href="/password-reset">{chunks}</Link>,
              })
            }
          </RichText>
        );

        return (
          <section key={section} className="leading-lg my-8 text-lg">
            <Heading4>{header}</Heading4>
            {content}
          </section>
        );
      })}
    </>
  );
};

import dayjs from 'dayjs';
import { getTranslations } from 'next-intl/server';
import React from 'react';

import { Paragraph } from '../typography/paragraph';
import RichText from '../typography/rich-text';
import { TextButton } from '../ui/text-button';

const createFooterLinks = (t: Awaited<ReturnType<typeof getTranslations>>) => [
  { title: t('contacts'), url: '/contacts' },
];

export const Footer = async () => {
  const t = await getTranslations('global.menu');
  const footerT = await getTranslations('global');
  const footerLinks = createFooterLinks(t);

  return (
    <footer className="bg-uncategorized-main flex flex-wrap items-start justify-between gap-4 px-[20px] text-xs text-neutral-600 md:items-center lg:p-[28px]">
      <Paragraph className="leading-base my-0 flex flex-col items-start gap-4 md:flex-row md:gap-8">
        {footerLinks.map((link) => (
          <React.Fragment key={link.url}>
            <TextButton href={link.url} className="no-underline" variant="link" size="small">
              {link.title}
            </TextButton>{' '}
          </React.Fragment>
        ))}
      </Paragraph>
      <div className="inline-flex flex-col gap-5 md:flex-row">
        <RichText>
          {(tags) =>
            footerT.rich('footer', {
              ...tags,
              year: dayjs().year(),
              paragraph: (chunks) => <Paragraph className="m-0 text-sm">{chunks}</Paragraph>,
            })
          }
        </RichText>
      </div>
    </footer>
  );
};

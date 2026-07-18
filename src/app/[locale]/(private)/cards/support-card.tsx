import { getTranslations } from 'next-intl/server';

import { ChatsTeardrop, EnvelopeSimple } from '@/app/images';
import { Heading3 } from '@/components/typography/headers';
import { Paragraph } from '@/components/typography/paragraph';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TextButton } from '@/components/ui/text-button';
import { env } from '@/lib/env';
import { cn } from '@/lib/utils';
interface Props {
  className?: string;
}

export const SupportCard = async ({ className }: Props) => {
  const t = await getTranslations('private.main.cards.support');
  const suggestionsUrl = env.NEXT_PUBLIC_SUGGESTIONS_FORM;

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-0">
        <Heading3>{t('title')}</Heading3>
      </CardHeader>
      <CardContent>
        <Paragraph>{t('description')}</Paragraph>
        <Paragraph className="mt-8 mb-0 flex flex-col items-start gap-4">
          {suggestionsUrl && (
            <TextButton size="huge" href={suggestionsUrl} icon={<ChatsTeardrop />}>
              {t('button.suggestions-form')}
            </TextButton>
          )}
          <TextButton size="huge" href="mailto:support@student-portal.app" icon={<EnvelopeSimple />}>
            {t('button.email')}
          </TextButton>
        </Paragraph>
      </CardContent>
    </Card>
  );
};

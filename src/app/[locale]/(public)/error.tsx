'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { Heading2 } from '@/components/typography/headers';
import { Paragraph } from '@/components/typography/paragraph';
import { Button } from '@/components/ui/button';

export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('global.error');

  useEffect(() => {
    console.error('[public-error]', error.message, error.digest);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <Heading2>{t('title')}</Heading2>
      <Paragraph>{t('description')}</Paragraph>
      <Button variant="primary" onClick={reset}>
        {t('retry')}
      </Button>
    </div>
  );
}

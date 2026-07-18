'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { Heading2 } from '@/components/typography/headers';
import { Paragraph } from '@/components/typography/paragraph';
import { Button } from '@/components/ui/button';
import { useServerErrorToast } from '@/hooks/use-server-error-toast';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { errorToast } = useServerErrorToast();
  const t = useTranslations('global.error');

  useEffect(() => {
    errorToast();
  }, [errorToast]);

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

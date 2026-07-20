'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';

import { useToast } from './use-toast';

export const useServerErrorToast = () => {
  const errorTranslation = useTranslations('global.server-error');
  const { toast } = useToast();

  const errorToast = useCallback(
    () =>
      toast({
        variant: 'destructive',
        title: errorTranslation('title'),
        description: errorTranslation('description'),
      }),
    [errorTranslation, toast],
  );

  return { errorToast };
};

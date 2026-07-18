import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

interface Props {
  t: ReturnType<typeof useTranslations<string>>;
}

export const LoadingState = ({ t }: Props) => (
  <div className="space-y-2 text-center">
    <Loader2 className="mx-auto h-8 w-8 animate-spin text-neutral-900" />
    <div className="font-medium text-neutral-900">{t('checking')}</div>
    <div className="text-muted-foreground text-sm">{t('wait')}</div>
  </div>
);

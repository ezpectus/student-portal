import { GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
  t: ReturnType<typeof useTranslations<string>>;
}

export const EmptyState = ({ t }: Props) => (
  <div className="text-muted-foreground text-center">
    <GraduationCap className="mx-auto mb-3 h-12 w-12 text-neutral-400" />
    <div className="font-medium text-neutral-900">{t('empty')}</div>
    <div className="text-sm">{t('enter')}</div>
  </div>
);

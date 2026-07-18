import dayjs from 'dayjs';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { dash } from 'radash';

import { DetailRow } from '@/app/[locale]/(public)/validate-certificate/components/detail-row';
import { Badge } from '@/components/ui/badge';
import { CertificateVerificationResult } from '@/types/models/certificate/certificate-verification-result';

interface Props {
  result: CertificateVerificationResult;
  t: ReturnType<typeof useTranslations<string>>;
}

export const CertificateDetails = ({ result, t }: Props) => {
  const tEnums = useTranslations('global.enums.certificate-type');

  return (
    <div className="w-full space-y-4">
      <div className="mb-4 flex items-center gap-3 rounded bg-green-50 px-4 py-3">
        <CheckCircle2 className="text-status-success-300 h-6 w-6 flex-shrink-0" />
        <div className="text-status-success-300 font-medium">{t('success')}</div>
      </div>

      <div className="flex flex-col gap-4 space-y-6">
        <DetailRow label={t('owner')}>{result.requestor}</DetailRow>

        <DetailRow label={t('date')}>{dayjs(result.date).format('DD.MM.YYYY')}</DetailRow>

        <DetailRow label={t('type')}>
          <Badge variant="blue" className="text-xs font-medium">
            {tEnums(dash(result.type))}
          </Badge>
        </DetailRow>

        <DetailRow label={t('purpose')}>{result.purpose}</DetailRow>
      </div>
    </div>
  );
};

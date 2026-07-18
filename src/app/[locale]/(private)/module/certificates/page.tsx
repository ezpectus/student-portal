import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getCertificateList, getCertificateTypes } from '@/actions/certificates.actions';
import { HistoryTable } from '@/app/[locale]/(private)/module/certificates/components/history-table';
import { RequestCertificateForm } from '@/app/[locale]/(private)/module/certificates/components/request-certificate-form';
import { SubLayout } from '@/app/[locale]/(private)/sub-layout';
import { Heading2, Paragraph } from '@/components/typography';
import { LocaleProps } from '@/types/locale-props';

const INTL_NAMESPACE = 'private.certificate';

export async function generateMetadata({ params }: LocaleProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: INTL_NAMESPACE });

  return {
    title: t('title'),
  };
}

export default async function CertificatePage({ params }: LocaleProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const certificates = await getCertificateList();
  const types = await getCertificateTypes();
  const t = await getTranslations(INTL_NAMESPACE);

  return (
    <SubLayout pageTitle={t('title')}>
      <div className="col-span-12 w-full px-2 sm:px-4 md:px-0">
        <Heading2>{t('title')}</Heading2>
        <Paragraph className="leading-sm mt-3 mb-7 max-w-full text-sm font-normal text-neutral-700 sm:max-w-2xl">
          {t('info')}
        </Paragraph>
        <div className="flex flex-col gap-5 lg:flex-row">
          <RequestCertificateForm certificateTypes={types} />

          <HistoryTable certificates={certificates} />
        </div>
      </div>
    </SubLayout>
  );
}

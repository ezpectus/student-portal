import { setRequestLocale } from 'next-intl/server';

import { SubLayout } from '@/app/[locale]/(private)/sub-layout';
import { LocaleProps } from '@/types/locale-props';

import { AttendanceScanContent } from './scan-content';

export default async function AttendanceScanPage({ params, searchParams }: LocaleProps & { searchParams: Promise<{ token?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { token } = await searchParams;

  return (
    <SubLayout pageTitle="Attendance">
      <div className="col-span-12">
        <AttendanceScanContent token={token ?? ''} />
      </div>
    </SubLayout>
  );
}

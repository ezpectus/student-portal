import { getTranslations, setRequestLocale } from 'next-intl/server';

import { getUserDetails } from '@/actions/auth.actions';
import { getDashboardData } from '@/actions/dashboard.actions';
import { LocaleProps } from '@/types/locale-props';

import { AnnouncementsCard, SupportCard } from './cards';
import { DashboardCharts } from './components/dashboard-charts';
import { DashboardMetrics } from './components/dashboard-metrics';
import { ExportButtons } from './components/export-buttons';
import { ProfileCompletionCard } from './components/profile-completion-card';
import Greeting from './greeting';

const INTL_NAMESPACE = 'private.main.dashboard';

export async function generateMetadata({ params }: LocaleProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: INTL_NAMESPACE });
  return { title: t('title') };
}

export default async function Home({ params }: LocaleProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const data = await getDashboardData();
  const user = await getUserDetails();

  return (
    <div className="flex flex-col gap-[20px]">
      <Greeting />
      <DashboardMetrics metrics={data.metrics} />
      <ExportButtons />
      <DashboardCharts
        gpaTrend={data.gpaTrend}
        gradeDistribution={data.gradeDistribution}
        attendanceData={data.attendanceData}
      />
      <div className="grid auto-rows-max grid-cols-12 gap-[20px] lg:auto-rows-auto">
        <AnnouncementsCard className="col-span-full w-full 2xl:col-span-8" />
        <div className="col-span-full flex flex-col gap-[20px] lg:col-span-6 xl:col-span-4">
          {user && <ProfileCompletionCard user={user} />}
          <SupportCard />
        </div>
      </div>
    </div>
  );
}

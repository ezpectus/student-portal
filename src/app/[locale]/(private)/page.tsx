import Greeting from './greeting';
import { AnnouncementsCard, SupportCard } from './cards';
import { DashboardMetrics } from './components/dashboard-metrics';
import { DashboardCharts } from './components/dashboard-charts';
import { ProfileCompletionCard } from './components/profile-completion-card';
import { getDashboardData } from '@/actions/dashboard.actions';
import { getUserDetails } from '@/actions/auth.actions';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LocaleProps } from '@/types/locale-props';

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

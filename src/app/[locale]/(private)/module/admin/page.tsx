import { getTranslations, setRequestLocale } from 'next-intl/server';

import { SubLayout } from '@/app/[locale]/(private)/sub-layout';
import { LocaleProps } from '@/types/locale-props';
import { getAdminUsers, getAdminStats, getDbStats, getFaculties } from '@/actions/admin.actions';

import { AdminPageContent } from './admin-page-content';

const INTL_NAMESPACE = 'private.admin';

export async function generateMetadata({ params }: LocaleProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: INTL_NAMESPACE });
  return {
    title: t('title'),
  };
}

interface PageProps extends LocaleProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    status?: string;
    faculty?: string;
    page?: string;
  }>;
}

export default async function AdminPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;

  const [users, stats, faculties, dbStats] = await Promise.all([
    getAdminUsers({
      search: sp.search ?? '',
      role: sp.role ?? 'all',
      status: sp.status ?? 'all',
      faculty: sp.faculty ?? 'all',
    }),
    getAdminStats(),
    getFaculties(),
    getDbStats(),
  ]);

  return (
    <SubLayout pageTitle="Admin Panel">
      <div className="col-span-12">
        <AdminPageContent
          users={users.items}
          totalCount={users.total}
          faculties={faculties}
          stats={{
            totalUsers: stats.totalUsers,
            students: stats.students,
            activeStudents: stats.activeStudents,
            avgGpa: stats.avgGpa,
          }}
          dbStats={dbStats}
        />
      </div>
    </SubLayout>
  );
}

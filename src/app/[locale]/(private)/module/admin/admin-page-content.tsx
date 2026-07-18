'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui/card';
import { Heading2, Description } from '@/components/typography';
import { AdminStatsCards } from './components/admin-stats-cards';
import { AdminFilters } from './components/admin-filters';
import { AdminTable } from './components/admin-table';
import { UserDetailDialog } from './components/user-detail-dialog';
import { DeleteUserDialog } from './components/delete-user-dialog';
import { AdminDbViewer } from './components/admin-db-viewer';
import { AuditLogViewer } from './components/audit-log-viewer';
import { AdminUser, AdminUserDetail } from './types';
import { getAdminUserById, deleteUser } from '@/actions/admin.actions';
import { useServerErrorToast } from '@/hooks/use-server-error-toast';
import { useToast } from '@/hooks/use-toast';

interface Props {
  users: AdminUser[];
  totalCount: number;
  faculties: string[];
  stats: {
    totalUsers: number;
    students: number;
    activeStudents: number;
    avgGpa: number;
  };
  dbStats: {
    users: number;
    courses: number;
    attendance: number;
    notifications: number;
  };
}

export const AdminPageContent = ({ users, totalCount, faculties, stats, dbStats }: Props) => {
  const t = useTranslations('private.admin');
  const { errorToast } = useServerErrorToast();
  const { toast } = useToast();

  const [detailUser, setDetailUser] = useState<AdminUserDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState('');

  const handleView = async (id: number) => {
    try {
      const detail = await getAdminUserById(id);
      if (detail) {
        setDetailUser(detail);
        setDetailOpen(true);
      }
    } catch {
      errorToast();
    }
  };

  const handleDeleteClick = (id: number) => {
    const user = users.find((u) => u.id === id);
    setDeleteId(id);
    setDeleteName(user?.fullName ?? '');
  };

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return;
    try {
      await deleteUser(deleteId);
      toast({ title: t('delete.success') });
      setDeleteId(null);
    } catch {
      errorToast();
    }
  };

  return (
    <>
      <Heading2>{t('title')}</Heading2>
      <Description>{t('subtitle')}</Description>

      <div className="mt-6">
        <AdminStatsCards
          totalUsers={stats.totalUsers}
          students={stats.students}
          activeStudents={stats.activeStudents}
          avgGpa={stats.avgGpa}
        />
      </div>

      <Card className="mt-6">
        <CardContent className="flex flex-col gap-4 p-4 md:p-6">
          <AdminFilters faculties={faculties} />
          <AdminTable
            items={users}
            totalCount={totalCount}
            onView={handleView}
            onDelete={handleDeleteClick}
          />
        </CardContent>
      </Card>

      <UserDetailDialog
        user={detailUser}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <AdminDbViewer initialStats={dbStats} />

      <AuditLogViewer />

      <DeleteUserDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        userName={deleteName}
      />
    </>
  );
};

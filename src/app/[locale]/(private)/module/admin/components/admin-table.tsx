'use client';

import dayjs from 'dayjs';
import { Eye, Trash, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { memo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PaginationWithLinks } from '@/components/ui/pagination-with-links';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Show } from '@/components/utils/show';
import { EmptyState } from '@/components/utils/empty-state';
import { usePagination } from '@/hooks/use-pagination';
import { useTableSort } from '@/hooks/use-table-sort';
import { PAGE_SIZE_DEFAULT } from '@/lib/constants/page-size';

import { AdminUser } from '../types';

interface Props {
  items: AdminUser[];
  totalCount: number;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
}

const roleBadgeVariant: Record<string, 'blue' | 'purple' | 'orange'> = {
  STUDENT: 'blue',
  TEACHER: 'purple',
  ADMIN: 'orange',
};

const statusBadgeVariant: Record<string, 'success' | 'yellow' | 'error'> = {
  Studying: 'success',
  OnAcademicLeave: 'yellow',
  Dismissed: 'error',
};

export const AdminTable = memo(function AdminTable({ items, totalCount, onView, onDelete }: Props) {
  const t = useTranslations('private.admin.table');
  const tRole = useTranslations('private.admin.filters');

  const { sortedRows, sortHandlers } = useTableSort(
    items,
    (row, header) => {
      if (header === 'fullName') return row.fullName;
      if (header === 'email') return row.email;
      if (header === 'gpa') return row.gpa;
      if (header === 'createdAt') return row.createdAt;
      return row[header as keyof AdminUser];
    },
    ['fullName', 'email', 'gpa', 'createdAt'],
  );
  const { paginatedItems } = usePagination(PAGE_SIZE_DEFAULT, sortedRows);

  if (items.length === 0) {
    return <EmptyState icon={<Users size={24} />} title={t('empty')} />;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead sortHandlers={sortHandlers} sortHeader="fullName">
              {t('name')}
            </TableHead>
            <TableHead sortHandlers={sortHandlers} sortHeader="email">
              {t('email')}
            </TableHead>
            <TableHead>{t('category')}</TableHead>
            <TableHead>{t('faculty')}</TableHead>
            <TableHead>{t('status')}</TableHead>
            <TableHead sortHandlers={sortHandlers} sortHeader="gpa">
              {t('gpa')}
            </TableHead>
            <TableHead>{t('last-active')}</TableHead>
            <TableHead className="text-right">{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedItems.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {user.fullName}
                </div>
                <p className="text-xs text-neutral-400">{user.username}</p>
              </TableCell>
              <TableCell className="text-sm text-neutral-600">{user.email}</TableCell>
              <TableCell>
                <Badge variant={roleBadgeVariant[user.role] ?? 'neutral'}>
                  {tRole(`role-${user.role.toLowerCase()}`)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-neutral-600">{user.faculty ?? '—'}</TableCell>
              <TableCell>
                {user.status && (
                  <Badge variant={statusBadgeVariant[user.status] ?? 'neutral'}>
                    {tRole(`status-${user.status === 'Studying' ? 'studying' : user.status === 'OnAcademicLeave' ? 'leave' : 'dismissed'}`)}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="font-semibold">{user.gpa.toFixed(2)}</TableCell>
              <TableCell className="text-sm text-neutral-500">
                {dayjs(user.lastActiveAt).format('DD.MM.YYYY')}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="tertiary"
                    size="small"
                    onClick={() => onView(user.id)}
                    aria-label={t('view')}
                  >
                    <Eye size={16} />
                  </Button>
                  <Button
                    variant="tertiary"
                    size="small"
                    onClick={() => onDelete(user.id)}
                    aria-label={t('delete')}
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Show when={totalCount > PAGE_SIZE_DEFAULT}>
        <PaginationWithLinks page={1} pageSize={PAGE_SIZE_DEFAULT} totalCount={totalCount} />
      </Show>
    </>
  );
});

'use client';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { getAuditLogs } from '@/actions/audit.actions';
import { Card, CardContent } from '@/components/ui/card';
import { PaginationWithLinks } from '@/components/ui/pagination-with-links';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Show } from '@/components/utils/show';
import { PAGE_SIZE_DEFAULT } from '@/lib/constants/page-size';

interface AuditLogItem {
  id: number;
  action: string;
  entity: string;
  entityId: number | null;
  metadata: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    username: string;
    email: string;
  };
}

export const AuditLogViewer = () => {
  const t = useTranslations('private.admin.audit');
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await getAuditLogs(1, PAGE_SIZE_DEFAULT);
        setItems(result.items as AuditLogItem[]);
        setTotal(result.total);
      } catch {
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <Card className="mt-6">
        <CardContent className="p-4 md:p-6">
          <p className="text-muted-foreground text-center text-sm">{t('loading')}</p>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="p-4 md:p-6">
          <p className="text-muted-foreground text-center text-sm">{t('empty')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardContent className="flex flex-col gap-4 p-4 md:p-6">
        <h3 className="text-lg font-semibold">{t('title')}</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('column.time')}</TableHead>
              <TableHead>{t('column.user')}</TableHead>
              <TableHead>{t('column.action')}</TableHead>
              <TableHead>{t('column.entity')}</TableHead>
              <TableHead>{t('column.details')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {dayjs(item.createdAt).format('DD.MM.YYYY HH:mm')}
                </TableCell>
                <TableCell className="text-sm">{item.user.fullName}</TableCell>
                <TableCell className="text-sm">
                  <span className="font-medium">{t(`action.${item.action}`, { defaultMessage: item.action })}</span>
                </TableCell>
                <TableCell className="text-sm">{item.entity}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {item.entityId ? `#${item.entityId}` : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Show when={total > PAGE_SIZE_DEFAULT}>
          <PaginationWithLinks page={1} pageSize={PAGE_SIZE_DEFAULT} totalCount={total} />
        </Show>
      </CardContent>
    </Card>
  );
};

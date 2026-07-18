'use client';

import dayjs from 'dayjs';
import { Megaphone, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PencilRegular } from '@/app/images';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/utils/empty-state';
import { useTableSort } from '@/hooks/use-table-sort';
import { Link } from '@/i18n/routing';
import { isOutdated } from '@/lib/date.utils';
import { AdminAnnouncementItem } from '@/types/models/announcement';

import { coursesText,formatFilterCell, rolesText, studyFormsText } from './utils';

interface Props {
  items: AdminAnnouncementItem[];
  onDelete: (item: AdminAnnouncementItem) => void;
}

export const AnnouncementsTable = ({ items, onDelete }: Props) => {
  const t = useTranslations('private.announcementseditor');
  const noRestriction = t('table.noRestriction');

  const { sortedRows, sortHandlers } = useTableSort<AdminAnnouncementItem, 'filter' | 'announcement'>(
    items,
    (row, header) => {
      if (header === 'announcement') return row.announcement.title;
      return row.filter ?? '';
    },
    ['announcement', 'filter'],
  );

  if (items.length === 0) {
    return <EmptyState icon={<Megaphone size={24} />} title={t('table.empty')} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead sortHandlers={sortHandlers} sortHeader="announcement">
            {t('table.title')}
          </TableHead>
          <TableHead className="w-20">{t('table.language')}</TableHead>
          <TableHead sortHandlers={sortHandlers} sortHeader="filter" className="w-48 min-w-32">
            {t('table.period')}
          </TableHead>
          <TableHead className="w-28">{t('table.status')}</TableHead>
          <TableHead className="min-w-28 max-w-40 text-start">{t('table.roles')}</TableHead>
          <TableHead className="min-w-28 max-w-40 text-start">{t('table.studyForms')}</TableHead>
          <TableHead className="min-w-24 max-w-32 text-start">{t('table.courses')}</TableHead>
          <TableHead className="w-28 text-right">{t('table.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedRows.map((item) => {
          const { announcement, filter } = item;
          const outdated = isOutdated(announcement.end);

          return (
            <TableRow key={announcement.id}>
              <TableCell className="max-w-md font-medium">
                <span className="line-clamp-2">{announcement.title}</span>
              </TableCell>
              <TableCell>
                <Badge variant="neutral" className="uppercase">
                  {announcement.language ?? '—'}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {dayjs(announcement.start).format('DD.MM.YYYY')} – {dayjs(announcement.end).format('DD.MM.YYYY')}
              </TableCell>
              <TableCell>
                <Badge variant={outdated ? 'default' : 'success'}>
                  {outdated ? t('status.outdated') : t('status.active')}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground align-middle text-start">
                {formatFilterCell(rolesText(filter), noRestriction)}
              </TableCell>
              <TableCell className="text-muted-foreground align-middle text-start">
                {formatFilterCell(studyFormsText(filter), noRestriction)}
              </TableCell>
              <TableCell className="text-muted-foreground align-middle text-start">
                {formatFilterCell(coursesText(filter), noRestriction)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button variant="tertiary" size="small" aria-label={t('actions.edit')} asChild>
                    <Link href={`/module/announcementseditor/${announcement.id}/edit`}>
                      <PencilRegular />
                    </Link>
                  </Button>
                  <Button variant="tertiary" size="small" aria-label={t('actions.delete')} onClick={() => onDelete(item)}>
                    <Trash2 className="text-other-red" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

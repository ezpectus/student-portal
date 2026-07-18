'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/i18n/routing';
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MagnifyingGlassBold } from '@/app/images';

interface Props {
  faculties: string[];
}

export const AdminFilters = ({ faculties }: Props) => {
  const t = useTranslations('private.admin.filters');
  const tRole = useTranslations('private.admin.filters');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set('page', '1');
      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname],
  );

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <Input
        placeholder={t('search-placeholder')}
        icon={<MagnifyingGlassBold />}
        size="medium"
        className="md:max-w-xs"
        defaultValue={searchParams.get('search') ?? ''}
        onChange={(e) => updateParam('search', e.target.value)}
      />
      <Select
        defaultValue={searchParams.get('role') ?? 'all'}
        onValueChange={(v) => updateParam('role', v)}
      >
        <SelectTrigger className="md:w-[180px]">
          <SelectValue placeholder={t('category')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('all-categories')}</SelectItem>
          <SelectItem value="STUDENT">{tRole('role-student')}</SelectItem>
          <SelectItem value="TEACHER">{tRole('role-teacher')}</SelectItem>
          <SelectItem value="ADMIN">{tRole('role-admin')}</SelectItem>
        </SelectContent>
      </Select>
      <Select
        defaultValue={searchParams.get('status') ?? 'all'}
        onValueChange={(v) => updateParam('status', v)}
      >
        <SelectTrigger className="md:w-[180px]">
          <SelectValue placeholder={t('status')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('all-statuses')}</SelectItem>
          <SelectItem value="Studying">{tRole('status-studying')}</SelectItem>
          <SelectItem value="OnAcademicLeave">{tRole('status-leave')}</SelectItem>
          <SelectItem value="Dismissed">{tRole('status-dismissed')}</SelectItem>
        </SelectContent>
      </Select>
      <Select
        defaultValue={searchParams.get('faculty') ?? 'all'}
        onValueChange={(v) => updateParam('faculty', v)}
      >
        <SelectTrigger className="md:w-[200px]">
          <SelectValue placeholder={t('faculty')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('all-faculties')}</SelectItem>
          {faculties.map((f) => (
            <SelectItem key={f} value={f}>
              {f}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

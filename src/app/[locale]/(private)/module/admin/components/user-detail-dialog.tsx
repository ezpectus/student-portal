'use client';

import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

import { AdminUserDetail } from '../types';

interface Props {
  user: AdminUserDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export const UserDetailDialog = ({ user, open, onOpenChange }: Props) => {
  const t = useTranslations('private.admin.detail');
  const tRole = useTranslations('private.admin.filters');

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{user.fullName}</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Badge variant={roleBadgeVariant[user.role] ?? 'neutral'}>
            {tRole(`role-${user.role.toLowerCase()}`)}
          </Badge>
          {user.status && (
            <Badge variant={statusBadgeVariant[user.status] ?? 'neutral'}>
              {tRole(`status-${user.status === 'Studying' ? 'studying' : user.status === 'OnAcademicLeave' ? 'leave' : 'dismissed'}`)}
            </Badge>
          )}
          {user.codeOfHonorSigned ? (
            <Badge variant="success">{t('honor-code-signed')}</Badge>
          ) : (
            <Badge variant="error">{t('honor-code-unsigned')}</Badge>
          )}
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow label={t('username')} value={user.username} />
          <InfoRow label={t('phone')} value={user.phone ?? '—'} />
          <InfoRow label={t('birth-date')} value={user.birthDate ?? '—'} />
          <InfoRow label={t('address')} value={user.address ?? '—'} />
          <InfoRow label={t('faculty')} value={user.faculty ?? '—'} />
          <InfoRow label={t('speciality')} value={user.speciality ?? '—'} />
          <InfoRow label={t('group')} value={user.groupName ?? '—'} />
          <InfoRow label={t('grade-book')} value={user.gradeBookNumber ?? '—'} />
          <InfoRow label={t('study-year')} value={String(user.studyYear)} />
          <InfoRow label={t('gpa')} value={user.gpa.toFixed(2)} />
          <InfoRow label={t('created-at')} value={dayjs(user.createdAt).format('DD.MM.YYYY')} />
          <InfoRow label={t('last-active')} value={dayjs(user.lastActiveAt).format('DD.MM.YYYY')} />
        </div>

        <Separator />

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase text-neutral-500">{t('courses')}</h4>
          <div className="space-y-2">
            {user.courses.map((course) => (
              <div key={course.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{course.name}</p>
                  <p className="text-xs text-neutral-400">{course.credits} {t('credits')}</p>
                </div>
                <Badge variant={course.grade >= 90 ? 'success' : course.grade >= 75 ? 'blue' : course.grade >= 60 ? 'yellow' : 'error'}>
                  {course.grade}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase text-neutral-500">{t('attendance')}</h4>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {user.attendance.map((a) => {
              const pct = a.total > 0 ? Math.round((a.present / a.total) * 100) : 0;
              return (
                <div key={a.id} className="rounded-lg border p-2 text-center">
                  <p className="text-xs font-medium">{a.month}</p>
                  <p className="text-lg font-bold">{pct}%</p>
                  <p className="text-xs text-neutral-400">{a.present}/{a.total}</p>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-medium uppercase text-neutral-400">{label}</p>
    <p className="text-sm text-neutral-900">{value}</p>
  </div>
);

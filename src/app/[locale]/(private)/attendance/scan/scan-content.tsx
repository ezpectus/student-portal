'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { verifyAttendanceQR } from '@/actions/qr-attendance.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  token: string;
}

export const AttendanceScanContent = ({ token }: Props) => {
  const t = useTranslations('private.attendance');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-token'>('loading');
  const [courseName, setCourseName] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    let cancelled = false;

    const verify = async () => {
      try {
        const result = await verifyAttendanceQR(token);
        if (cancelled) return;
        if (result.ok) {
          setCourseName(result.courseName ?? '');
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    };

    void verify();
    return () => { cancelled = true; };
  }, [token]);

  if (status === 'no-token') {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <XCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-center text-sm text-muted-foreground">{t('no-token')}</p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'loading') {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <XCircle className="h-12 w-12 text-destructive" />
          <p className="text-center text-sm text-muted-foreground">{t('error')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle className="text-center">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3 py-8">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <p className="text-center text-lg font-semibold">{t('success')}</p>
        {courseName && (
          <p className="text-center text-sm text-muted-foreground">{courseName}</p>
        )}
      </CardContent>
    </Card>
  );
};

'use client';

import { QrCode } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { generateAttendanceQR } from '@/actions/qr-attendance.actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useServerErrorToast } from '@/hooks/use-server-error-toast';
import { useToast } from '@/hooks/use-toast';

interface Props {
  courseName: string;
}

export const QrAttendanceGenerator = ({ courseName }: Props) => {
  const t = useTranslations('private.grading.qr');
  const { errorToast } = useServerErrorToast();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        setToken(null);
        setExpiresAt(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateAttendanceQR(courseName);
      setToken(result.token);
      setExpiresAt(new Date(result.expiresAt));
      toast({ title: t('generated') });
    } catch {
      errorToast();
    } finally {
      setLoading(false);
    }
  };

  const qrUrl = token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/uk/attendance/scan?token=${token}`
    : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {token ? (
          <>
            <div className="rounded-lg border-2 border-border p-4">
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrUrl)}`}
                alt="QR Code"
                width={256}
                height={256}
                unoptimized
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('expires-in')} {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
            </p>
            <Button variant="tertiary" size="small" onClick={handleGenerate} loading={loading}>
              {t('regenerate')}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground text-center">{t('description')}</p>
            <Button onClick={handleGenerate} loading={loading}>
              {t('generate')}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

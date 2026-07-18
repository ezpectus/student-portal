'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { logout } from '@/actions/auth.actions';
import { getSessionExpiry } from '@/actions/session.actions';
import { Alert, AlertDescription } from '@/components/ui/alert';

const WARNING_THRESHOLD_MS = 5 * 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;

export const SessionExpiryBanner = () => {
  const t = useTranslations('global.session');
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkExpiry = async () => {
      const exp = await getSessionExpiry();
      if (!mounted || !exp) return;

      const ms = exp * 1000 - Date.now();
      setRemainingMs(ms);

      if (ms <= 0) {
        await logout();
      }
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, CHECK_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!remainingMs || remainingMs > WARNING_THRESHOLD_MS) {
    return null;
  }

  const minutes = Math.max(1, Math.ceil(remainingMs / 60000));

  return (
    <Alert variant="default" className="fixed bottom-4 right-4 z-50 max-w-sm border-status-warning-300/50 bg-status-warning-300/10">
      <AlertDescription className="text-sm">
        {t('expiring-soon', { minutes })}
      </AlertDescription>
    </Alert>
  );
};

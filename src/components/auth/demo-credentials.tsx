'use client';

import { KeyRound, Shield, GraduationCap, Presentation } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

interface Props {
  onSelect?: (username: string, password: string) => void;
}

const DEMO_USERS = [
  { key: 'admin', username: 'admin', password: 'test12345', icon: Shield },
  { key: 'teacher', username: 'teacher', password: 'test12345', icon: Presentation },
  { key: 'student', username: 'student', password: 'test12345', icon: GraduationCap },
] as const;

export const DemoCredentials = ({ onSelect }: Props) => {
  const t = useTranslations('auth.demo');

  if (process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS !== 'true') return null;

  return (
    <Card className="mt-6 border-dashed bg-muted/50">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <KeyRound size={16} className="text-basic-blue" />
          <div>
            <p className="text-sm font-semibold text-foreground">{t('title')}</p>
            <p className="text-xs text-muted-foreground">{t('description')}</p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {DEMO_USERS.map(({ key, username, password, icon: Icon }) => (
            <Button
              key={key}
              type="button"
              variant="tertiary"
              size="small"
              className="h-auto justify-start gap-2 border border-border bg-card px-3 py-2 text-left"
              onClick={() => onSelect?.(username, password)}
            >
              <Icon size={16} />
              <span className="min-w-0">
                <span className="block text-xs font-semibold">{t(`roles.${key}`)}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{username} / {password}</span>
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

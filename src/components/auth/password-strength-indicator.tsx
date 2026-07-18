'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  password: string;
}

type StrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

function calculateStrength(password: string): { level: StrengthLevel; score: number } {
  if (!password) return { level: 'empty', score: 0 };

  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const level: StrengthLevel = score <= 2 ? 'weak' : score <= 3 ? 'fair' : score <= 4 ? 'good' : 'strong';
  return { level, score };
}

const STRENGTH_COLORS: Record<StrengthLevel, string> = {
  empty: 'bg-muted',
  weak: 'bg-status-danger-300',
  fair: 'bg-status-warning-300',
  good: 'bg-blue-500',
  strong: 'bg-status-success-300',
};

const STRENGTH_BARS: Record<StrengthLevel, number> = {
  empty: 0,
  weak: 1,
  fair: 2,
  good: 3,
  strong: 4,
};

export const PasswordStrengthIndicator = ({ password }: Props) => {
  const t = useTranslations('auth.register.password-strength');

  const { level } = useMemo(() => calculateStrength(password), [password]);
  const bars = STRENGTH_BARS[level];

  if (level === 'empty') return null;

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i < bars ? STRENGTH_COLORS[level] : 'bg-muted'}`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{t(level)}</span>
    </div>
  );
};

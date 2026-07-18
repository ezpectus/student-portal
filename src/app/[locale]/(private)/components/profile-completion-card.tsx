'use client';

import { useTranslations } from 'next-intl';

import { CircleWavyCheck,WarningCircle } from '@/app/images';
import { Heading5 } from '@/components/typography/headers';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Show } from '@/components/utils/show';
import { Link } from '@/i18n/routing';
import { User } from '@/types/models/user';

interface Props {
  user: User;
}

type FieldKey = 'photo' | 'phone' | 'faculty' | 'speciality' | 'groupName' | 'birthDate' | 'address';

const FIELD_LABELS: FieldKey[] = ['photo', 'phone', 'faculty', 'speciality', 'groupName', 'birthDate', 'address'];

export const ProfileCompletionCard = ({ user }: Props) => {
  const t = useTranslations('private.main.profile-completion');

  const filledFields = FIELD_LABELS.filter((key) => {
    const value = user[key as keyof User];
    return value !== undefined && value !== null && value !== '';
  });

  const completionPercent = Math.round((filledFields.length / FIELD_LABELS.length) * 100);
  const isComplete = completionPercent === 100;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <Heading5>{t('title')}</Heading5>
          <Show when={isComplete} fallback={<WarningCircle className="text-status-warning-300" />}>
            <CircleWavyCheck className="text-status-success-300" />
          </Show>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('progress')}</span>
            <span className="font-medium text-foreground">{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </div>

        <Show when={!isComplete}>
          <div className="flex flex-col gap-1.5">
            {FIELD_LABELS.map((key) => {
              const value = user[key as keyof User];
              const isFilled = value !== undefined && value !== null && value !== '';
              return (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <Show when={isFilled} fallback={<span className="text-muted-foreground">○</span>}>
                    <span className="text-status-success-300">✓</span>
                  </Show>
                  <span className={isFilled ? 'text-muted-foreground line-through' : 'text-foreground'}>
                    {t(`fields.${key}`)}
                  </span>
                </div>
              );
            })}
          </div>
        </Show>

        <Show when={!isComplete}>
          <Button variant="secondary" size="medium" className="w-full" asChild>
            <Link href="/profile">{t('complete-profile')}</Link>
          </Button>
        </Show>
      </CardContent>
    </Card>
  );
};

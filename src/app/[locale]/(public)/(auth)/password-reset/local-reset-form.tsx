'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { resetPassword } from '@/actions/local-password.actions';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useServerErrorToast } from '@/hooks/use-server-error-toast';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from '@/i18n/routing';

const schema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

type FormData = z.infer<typeof schema>;

export const LocalPasswordResetForm = ({ initialToken }: { initialToken?: string }) => {
  const t = useTranslations('auth.passwordReset');
  const { errorToast } = useServerErrorToast();
  const { toast } = useToast();
  const router = useRouter();
  const [done, setDone] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      token: initialToken ?? '',
      newPassword: '',
    } as FormData,
  });

  const handleSubmit = async (data: FormData) => {
    try {
      const result = await resetPassword(data.token, data.newPassword);
      if (result.ok) {
        toast({ title: t('success-message') });
        setDone(true);
        setTimeout(() => router.replace('/login'), 2000);
      } else {
        toast({ title: t('invalid-token'), variant: 'destructive' });
      }
    } catch {
      errorToast();
    }
  };

  if (done) {
    return <p className="py-4 text-center text-sm text-muted-foreground">{t('redirecting')}</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="token"
          render={({ field }) => (
            <FormItem className="grid w-full gap-2">
              <FormLabel>{t('field.token')}</FormLabel>
              <Input {...field} placeholder={t('placeholder.token')} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem className="grid w-full gap-2">
              <FormLabel>{t('field.new-password')}</FormLabel>
              <Input {...field} type="password" placeholder={t('placeholder.new-password')} />
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="big" className="w-full" loading={form.formState.isSubmitting}>
          {t('button.set-new-password')}
        </Button>
      </form>
    </Form>
  );
};

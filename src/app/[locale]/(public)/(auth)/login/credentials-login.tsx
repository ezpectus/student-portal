'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { loginWithCredentials } from '@/actions/auth.actions';
import { DemoCredentials } from '@/components/auth/demo-credentials';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PasswordInput from '@/components/ui/password-input';
import { useServerErrorToast } from '@/hooks/use-server-error-toast';
import { Link } from '@/i18n/routing';
import { useRouter } from '@/i18n/routing';

export const CredentialsLogin = () => {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const { errorToast } = useServerErrorToast();

  const FormSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
    rememberMe: z.boolean(),
  });

  type FormData = z.infer<typeof FormSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: true,
    },
  });

  const handleFormSubmit = async (data: FormData) => {
    form.clearErrors();

    try {
      const response = await loginWithCredentials(data.username, data.password, data.rememberMe);

      if (response && typeof response === 'object' && 'error' in response && response.error === 'rate-limited') {
        const minutes = Math.ceil(response.retryAfterMs / 60000);
        form.setError('root', { message: t('field.error-rate-limited', { minutes }) });
        return;
      }

      if (!response) {
        form.setError('root', { message: t('field.error') });
        return;
      }
      router.replace('/');
    } catch (error) {
      errorToast();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="mb-6 grid w-full items-center gap-2">
              <Label htmlFor="username">{t('field.username')}</Label>
              <Input {...field} data-testid="login-username" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="my-6 grid w-full items-center gap-2">
              <Label htmlFor="password">{t('field.password')}</Label>
              <PasswordInput {...field} data-testid="login-password" />
            </FormItem>
          )}
        />
        <div className="mb-6 flex items-center justify-between">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked)} />
                <Label className="text-neutral-800">{t('rememberMe')}</Label>
              </div>
            )}
          />
          <Link className="text-sm" href="/password-reset">
            {t('passwordReset')}
          </Link>
        </div>
        <FormMessage>{form.formState.errors.root?.message}</FormMessage>
        <Button size="big" className="my-4 w-full" type="submit" loading={form.formState.isSubmitting} data-testid="login-submit">
          {t('button.login')}
        </Button>
      </form>
      <DemoCredentials onSelect={(username, password) => {
        form.setValue('username', username);
        form.setValue('password', password);
      }} />
    </Form>
  );
};

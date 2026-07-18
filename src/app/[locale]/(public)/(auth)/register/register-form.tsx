'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { registerUser } from '@/actions/auth.actions';
import { DemoCredentials } from '@/components/auth/demo-credentials';
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PasswordInput from '@/components/ui/password-input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useServerErrorToast } from '@/hooks/use-server-error-toast';
import { Link } from '@/i18n/routing';
import { useRouter } from '@/i18n/routing';

export const RegisterForm = () => {
  const t = useTranslations('auth.register');
  const router = useRouter();
  const { errorToast } = useServerErrorToast();

  const FormSchema = z.object({
    name: z.string().min(1, { message: t('validation.name-required') }),
    email: z.string().min(1, { message: t('validation.email-required') }).email({ message: t('validation.email-invalid') }),
    schoolCode: z.string().min(1, { message: t('validation.school-code-required') }),
    password: z.string().min(8, { message: t('validation.password-min') }),
    passwordConfirm: z.string().min(1, { message: t('validation.password-confirm-required') }),
    role: z.enum(['STUDENT', 'TEACHER']),
  }).refine((data) => data.password === data.passwordConfirm, {
    message: t('validation.password-match'),
    path: ['passwordConfirm'],
  });

  type FormData = z.infer<typeof FormSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      email: '',
      schoolCode: '',
      password: '',
      passwordConfirm: '',
      role: 'STUDENT',
    },
  });

  const handleFormSubmit = async (data: FormData) => {
    form.clearErrors();

    try {
      const result = await registerUser(data.name, data.email, data.password, data.role, data.schoolCode);

      if (!result.ok) {
        form.setError('root', { message: t(`field.error.${result.error}`) });
        return;
      }

      router.push('/onboarding');
    } catch {
      errorToast();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="mb-6 grid w-full items-center gap-2">
              <Label htmlFor="name">{t('field.name')}</Label>
              <Input {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="mb-6 grid w-full items-center gap-2">
              <Label htmlFor="email">{t('field.email')}</Label>
              <Input {...field} type="email" />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="schoolCode"
          render={({ field }) => (
            <FormItem className="mb-6 grid w-full items-center gap-2">
              <Label htmlFor="schoolCode">{t('field.school-code')}</Label>
              <Input {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="mb-6 grid w-full items-center gap-2">
              <Label htmlFor="password">{t('field.password')}</Label>
              <PasswordInput {...field} />
              <PasswordStrengthIndicator password={field.value} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="passwordConfirm"
          render={({ field }) => (
            <FormItem className="mb-6 grid w-full items-center gap-2">
              <Label htmlFor="passwordConfirm">{t('field.passwordConfirm')}</Label>
              <PasswordInput {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="mb-6 grid w-full items-center gap-2">
              <Label>{t('field.role')}</Label>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="STUDENT" id="role-student" />
                  <Label htmlFor="role-student">{t('field.role-student')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="TEACHER" id="role-teacher" />
                  <Label htmlFor="role-teacher">{t('field.role-teacher')}</Label>
                </div>
              </RadioGroup>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormMessage>{form.formState.errors.root?.message}</FormMessage>
        <Button size="big" className="my-4 w-full" type="submit" loading={form.formState.isSubmitting}>
          {t('button.register')}
        </Button>
        <Link className="text-sm" href="/login">
          {t('button.login')}
        </Link>
      </form>
      <DemoCredentials />
    </Form>
  );
};

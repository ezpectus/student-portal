'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { logoutAllDevices } from '@/actions/local-auth.actions';
import { changeEmail, changePassword, changePhoto, updateNotificationPreferences } from '@/actions/settings.actions';
import { PhotoUploader } from '@/app/[locale]/(private)/settings/photo-uploader';
import { EnvelopeSimple } from '@/app/images';
import { ThemeToggle } from '@/components/theme-toggle';
import { Heading5 } from '@/components/typography/headers';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LocaleSwitch } from '@/components/ui/locale-switch';
import PasswordInput from '@/components/ui/password-input';
import { Switch } from '@/components/ui/switch';
import { useIsMobile } from '@/hooks/use-mobile';
import { useServerErrorToast } from '@/hooks/use-server-error-toast';
import { toast } from '@/hooks/use-toast';
import { getUniqueUserPhotoUrl } from '@/lib/utils';
import { User } from '@/types/models/user';

interface Props {
  user: User;
}

export function SettingsForm({ user }: Props) {
  const { errorToast } = useServerErrorToast();
  const isMobile = useIsMobile();
  const t = useTranslations('private.settings');
  const [file, setFile] = useState<File | null>(null);
  const [shouldShowEmailAlert, setShouldShowEmailAlert] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState({
    notifyEmail: (user as unknown as Record<string, unknown>).notifyEmail !== false,
    notifyAnnouncements: (user as unknown as Record<string, unknown>).notifyAnnouncements !== false,
    notifyMessages: (user as unknown as Record<string, unknown>).notifyMessages !== false,
  });
  const profilePhoto = getUniqueUserPhotoUrl(user.photo);

  const FormSchema = z
    .object({
      email: z
        .string()
        .trim()
        .min(1)
        .email({ message: t('error.invalid-email') }),
      currentPassword: z.string().trim().optional(),
      newPassword: z.string().trim().optional(),
      confirmPassword: z.string().trim().optional(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('error.password-mismatch'),
      path: ['confirmPassword'],
    });

  type FormData = z.infer<typeof FormSchema>;

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: user.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleFormSubmit = async (data: FormData) => {
    try {
      if (user.email !== data.email) {
        await changeEmail(data.email);
        setShouldShowEmailAlert(true);
      }

      if (file) {
        const formData = new FormData();
        formData.append('file', file, file.name);
        await changePhoto(formData);
      }

      if (data.newPassword && data.currentPassword && data.confirmPassword) {
        await changePassword(data.newPassword, data.currentPassword);
      }

      toast({
        title: t('success.title'),
        description: t('success.description'),
      });
    } catch (error) {
      errorToast();
    } finally {
      form.reset();
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      await logoutAllDevices();
    } catch {
      errorToast();
    }
  };

  const handleNotifToggle = async (key: keyof typeof notifPrefs, value: boolean) => {
    const newPrefs = { ...notifPrefs, [key]: value };
    setNotifPrefs(newPrefs);
    try {
      await updateNotificationPreferences(newPrefs);
      toast({ title: t('success.title'), description: t('notifications.saved') });
    } catch {
      setNotifPrefs(notifPrefs);
      errorToast();
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-8 space-y-1.5 p-6 md:p-10">
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <Heading5>{t('section.preferences')}</Heading5>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t('preferences.theme')}</p>
                <p className="text-xs text-muted-foreground">{t('preferences.theme-hint')}</p>
              </div>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t('preferences.language')}</p>
                <p className="text-xs text-muted-foreground">{t('preferences.language-hint')}</p>
              </div>
              <LocaleSwitch />
            </div>
          </div>
        </div>
        <Heading5>{t('section.photo')}</Heading5>
        <PhotoUploader photoSrc={profilePhoto} onFileUpload={setFile} />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col items-start space-y-4">
            <Heading5>{t('section.contacts')}</Heading5>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="my-6 grid w-full items-center gap-2">
                  <FormLabel htmlFor="email">E-mail</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="user@example.com" />
                  </FormControl>
                  {shouldShowEmailAlert && (
                    <FormDescription className="flex flex-col gap-3 md:flex-row md:items-center">
                      <EnvelopeSimple width={24} height={24} />
                      {t('success.email')}
                    </FormDescription>
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />

            <Heading5>{t('section.password')}</Heading5>
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem className="my-6 grid w-full items-center gap-2">
                  <FormLabel htmlFor="currentPassword">{t('field.current-password')}</FormLabel>
                  <PasswordInput {...field} value={field.value || ''} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem className="my-6 grid w-full items-center gap-2">
                  <FormLabel htmlFor="newPassword">{t('field.new-password')}</FormLabel>
                  <PasswordInput {...field} value={field.value || ''} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="my-6 grid w-full items-center gap-2">
                  <FormLabel htmlFor="confirmPassword">{t('field.confirm-password')}</FormLabel>
                  <PasswordInput {...field} value={field.value || ''} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormMessage className="text-status-danger-300">{form.formState.errors.root?.message}</FormMessage>
            <Button
              size={isMobile ? 'medium' : 'big'}
              className="my-4 ml-auto"
              type="submit"
              loading={form.formState.isSubmitting}
            >
              {t('button.save-changes')}
            </Button>
          </form>
        </Form>
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <Heading5>{t('notifications.title')}</Heading5>
          <p className="mt-1 text-sm text-muted-foreground">{t('notifications.description')}</p>
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t('notifications.email')}</p>
                <p className="text-xs text-muted-foreground">{t('notifications.email-hint')}</p>
              </div>
              <Switch
                checked={notifPrefs.notifyEmail}
                onCheckedChange={(v) => handleNotifToggle('notifyEmail', v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t('notifications.announcements')}</p>
                <p className="text-xs text-muted-foreground">{t('notifications.announcements-hint')}</p>
              </div>
              <Switch
                checked={notifPrefs.notifyAnnouncements}
                onCheckedChange={(v) => handleNotifToggle('notifyAnnouncements', v)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{t('notifications.messages')}</p>
                <p className="text-xs text-muted-foreground">{t('notifications.messages-hint')}</p>
              </div>
              <Switch
                checked={notifPrefs.notifyMessages}
                onCheckedChange={(v) => handleNotifToggle('notifyMessages', v)}
              />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-status-danger-300/30 bg-status-danger-300/5 p-4">
          <Heading5>{t('section.security')}</Heading5>
          <p className="mt-2 text-sm text-muted-foreground">{t('security.logout-all-description')}</p>
          <Button
            variant="secondary"
            size="medium"
            className="mt-4"
            icon={<LogOut className="h-4 w-4" />}
            onClick={handleLogoutAllDevices}
          >
            {t('security.logout-all')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

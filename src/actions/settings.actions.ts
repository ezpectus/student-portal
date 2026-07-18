'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { logAuditEvent } from '@/actions/audit.actions';
import { throwApiError } from '@/lib/api-error';
import { apiFetch } from '@/lib/client';
import { env } from '@/lib/env';
import { UnauthorizedError } from '@/lib/errors';
import { fileUpload } from '@/lib/file-upload';
import { prisma } from '@/lib/prisma';
import { validateInput } from '@/lib/validate';

const emailSchema = z.object({
  email: z.string().email().max(255),
});

/**
 * @throws {ValidationError} If email format is invalid.
 * @throws {ActionError} On API failure.
 */
export async function changeEmail(email: string) {
  const validated = validateInput(emailSchema, { email }, 'changeEmail');

  const response = await apiFetch('settings/email', {
    method: 'PUT',
    body: JSON.stringify({ email: validated.email }),
  });

  if (!response.ok) {
    throwApiError(response.status);
  }

  await logAuditEvent({ action: 'change_email', entity: 'User' });
  revalidatePath('/settings');
}

export async function changePhoto(formData: FormData) {
  await fileUpload('profile/photo', formData);
  await logAuditEvent({ action: 'change_photo', entity: 'User' });
  revalidatePath('/');
}

const passwordSchema = z.object({
  password: z.string().min(8).max(128),
  currentPassword: z.string().min(1).max(128),
});

/**
 * @throws {ValidationError} If password is too short or too long.
 * @throws {ActionError} On API failure.
 */
export async function changePassword(password: string, currentPassword: string) {
  const validated = validateInput(passwordSchema, { password, currentPassword }, 'changePassword');

  const response = await apiFetch('settings/password', {
    method: 'PUT',
    body: JSON.stringify({ password: validated.password, currentPassword: validated.currentPassword }),
  });

  if (!response.ok) {
    throwApiError(response.status);
  }

  await logAuditEvent({ action: 'change_password', entity: 'User' });
}

const notificationPrefsSchema = z.object({
  notifyEmail: z.boolean(),
  notifyAnnouncements: z.boolean(),
  notifyMessages: z.boolean(),
});

/**
 * @throws {ValidationError} If preferences shape is invalid.
 * @throws {ActionError} On API failure.
 */
export async function updateNotificationPreferences(preferences: {
  notifyEmail: boolean;
  notifyAnnouncements: boolean;
  notifyMessages: boolean;
}) {
  const validated = validateInput(notificationPrefsSchema, preferences, 'updateNotificationPreferences');
  if (env.NEXT_PUBLIC_LOCAL_AUTH !== 'true') {
    const response = await apiFetch('settings/notifications', {
      method: 'PUT',
      body: JSON.stringify(validated),
    });

    if (!response.ok) {
      throwApiError(response.status);
    }
  } else {
    const { getLocalUser } = await import('./local-auth.actions');
    const user = await getLocalUser();
    if (!user) throw new UnauthorizedError();

    await prisma.user.update({
      where: { id: user.id },
      data: validated,
    });
  }

  await logAuditEvent({ action: 'change_notifications', entity: 'User' });
  revalidatePath('/settings');
}

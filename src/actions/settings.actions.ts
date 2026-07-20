'use server';

import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { revalidatePath } from 'next/cache';
import path from 'path';
import { z } from 'zod';

import { logAuditEvent } from '@/actions/audit.actions';
import { throwApiError } from '@/lib/api-error';
import { apiFetch } from '@/lib/client';
import { requireCsrf } from '@/lib/csrf';
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
  await requireCsrf();
  const validated = validateInput(emailSchema, { email }, 'changeEmail');

  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    const { getLocalUserLite } = await import('./local-user.actions');
    const user = await getLocalUserLite();
    if (!user) throw new UnauthorizedError();

    const existing = await prisma.user.findFirst({
      where: { email: validated.email, NOT: { id: user.id } },
    });
    if (existing) throw new Error('Email already in use');

    await prisma.user.update({
      where: { id: user.id },
      data: { email: validated.email },
    });
  } else {
    const response = await apiFetch('settings/email', {
      method: 'PUT',
      body: JSON.stringify({ email: validated.email }),
    });

    if (!response.ok) {
      throwApiError(response.status);
    }
  }

  await logAuditEvent({ action: 'change_email', entity: 'User' });
  revalidatePath('/settings');
}

export async function changePhoto(formData: FormData) {
  await requireCsrf();
  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    const { getLocalUserLite } = await import('./local-user.actions');
    const user = await getLocalUserLite();
    if (!user) throw new UnauthorizedError();

    const file = formData.get('file') as File | null;
    if (!file) throw new Error('No file provided');

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size exceeds 5MB limit');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
    }

    const ext = file.type.split('/')[1];
    const filename = `${user.id}-${randomBytes(8).toString('hex')}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const photoUrl = `/uploads/avatars/${filename}`;
    await prisma.user.update({
      where: { id: user.id },
      data: { photo: photoUrl },
    });
  } else {
    await fileUpload('profile/photo', formData);
  }

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
  await requireCsrf();
  const validated = validateInput(passwordSchema, { password, currentPassword }, 'changePassword');

  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    const { getLocalUserLite } = await import('./local-user.actions');
    const user = await getLocalUserLite();
    if (!user) throw new UnauthorizedError();

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) throw new UnauthorizedError();

    const valid = await bcrypt.compare(validated.currentPassword, dbUser.passwordHash);
    if (!valid) throw new Error('Current password is incorrect');

    const passwordHash = await bcrypt.hash(validated.password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      },
    });
  } else {
    const response = await apiFetch('settings/password', {
      method: 'PUT',
      body: JSON.stringify({ password: validated.password, currentPassword: validated.currentPassword }),
    });

    if (!response.ok) {
      throwApiError(response.status);
    }
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
  await requireCsrf();
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
    const { getLocalUserLite } = await import('./local-user.actions');
    const user = await getLocalUserLite();
    if (!user) throw new UnauthorizedError();

    await prisma.user.update({
      where: { id: user.id },
      data: validated,
    });
  }

  await logAuditEvent({ action: 'change_notifications', entity: 'User' });
  revalidatePath('/settings');
}

'use server';

import { revalidateTag } from 'next/cache';
import queryString from 'query-string';
import { z } from 'zod';

import { getLocalUserLite } from '@/actions/local-user.actions';
import { throwApiError } from '@/lib/api-error';
import { apiFetch } from '@/lib/client';
import { MESSAGES_CACHE_TAG } from '@/lib/constants/cache-tags';
import { requireCsrf } from '@/lib/csrf';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { validateInput } from '@/lib/validate';
import { MailFilter } from '@/types/enums/mail-filter';
import { EntityIdName } from '@/types/models/entity-id-name';
import { Group } from '@/types/models/group';
import { Message } from '@/types/models/message';

/**
 * @throws {ActionError} On API failure.
 */
export async function getMails(filter: MailFilter = MailFilter.Incoming) {
  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    const user = await getLocalUserLite();
    if (!user) return [];

    try {
      const where = filter === MailFilter.Incoming
        ? { userId: user.id }
        : { senderId: user.id };

      const notifications = await prisma.notification.findMany({
        where,
        include: {
          sender: { select: { id: true, fullName: true, username: true } },
          user: { select: { id: true, fullName: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return notifications.map((n) => ({
        id: n.id,
        sender: {
          id: n.sender?.id ?? 0,
          name: n.sender?.fullName ?? n.sender?.username ?? 'System',
        },
        recipient: {
          id: n.user.id,
          name: n.user.fullName ?? n.user.username,
        },
        subject: n.title,
        content: n.message,
        isImportant: n.type === 'important',
        isRead: n.read,
        createdAt: n.createdAt.toISOString(),
      })) as Message[];
    } catch {
      return [];
    }
  }

  const response = await apiFetch(`/mail?filter=${filter}`, {
    next: { revalidate: 300, tags: [MESSAGES_CACHE_TAG] },
  });
  if (!response.ok) {
    throwApiError(response.status);
  }
  return (await response.json()) as Message[];
}

/**
 * @throws {ActionError} On API failure.
 */
export async function getMail(mailId: number) {
  const response = await apiFetch(`/mail/${mailId}`, {
    next: { revalidate: 300, tags: [MESSAGES_CACHE_TAG] },
  });
  if (!response.ok) {
    throwApiError(response.status);
  }
  return (await response.json()) as Message;
}

export async function getFacultyOptions() {
  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    try {
      const faculties = await prisma.user.findMany({
        where: { faculty: { not: null } },
        select: { faculty: true },
        distinct: ['faculty'],
      });
      return faculties
        .map((f, i) => ({ id: i + 1, name: f.faculty ?? '' }))
        .filter((f) => f.name !== '');
    } catch {
      return [];
    }
  }

  const response = await apiFetch('/mail/faculty-options');
  if (!response.ok) {
    throwApiError(response.status);
  }
  return (await response.json()) as EntityIdName[];
}

export async function getAllGroups() {
  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    try {
      const localUser = await getLocalUserLite();
      if (!localUser) return [];

      const schoolFilter = localUser.schoolId ? { schoolId: localUser.schoolId } : {};

      const groups = await prisma.user.findMany({
        where: { groupName: { not: null }, ...schoolFilter },
        select: { groupName: true },
        distinct: ['groupName'],
      });
      return groups
        .map((g, i) => ({ id: i + 1, name: g.groupName ?? '' }))
        .filter((g) => g.name !== '');
    } catch {
      return [];
    }
  }

  const allFaculties = await getFacultyOptions();
  const allFacultiesIds = allFaculties.map((faculty) => faculty.id);
  const query = queryString.stringify({ faculties: allFacultiesIds }, { arrayFormat: 'none' });
  const response = await apiFetch(`/mail/group-options?${query}`);
  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as EntityIdName[];
}

export async function deleteMail(mailIds: number[], deleteForRecipient: boolean) {
  await requireCsrf();
  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    const user = await getLocalUserLite();
    if (!user) throw new Error('Unauthorized');

    await prisma.notification.deleteMany({
      where: { id: { in: mailIds }, userId: user.id },
    });
    revalidateTag(MESSAGES_CACHE_TAG);
    return;
  }

  const query = queryString.stringify(
    { mailIds: mailIds, deleteForRecipient: deleteForRecipient },
    { arrayFormat: 'none' },
  );

  const response = await apiFetch(`/mail?${query}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throwApiError(response.status);
  }

  revalidateTag(MESSAGES_CACHE_TAG);
}

export async function markAsImportant(mailIds: number[], isImportant: boolean) {
  await requireCsrf();
  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    const user = await getLocalUserLite();
    if (!user) throw new Error('Unauthorized');

    await prisma.notification.updateMany({
      where: { id: { in: mailIds }, userId: user.id },
      data: { type: isImportant ? 'important' : 'info' },
    });
    revalidateTag(MESSAGES_CACHE_TAG);
    return;
  }

  const response = await apiFetch(`/mail/important`, {
    method: 'PATCH',
    body: JSON.stringify({ mailIds: mailIds, isImportant: isImportant }),
  });

  if (!response.ok) {
    throwApiError(response.status);
  }

  revalidateTag(MESSAGES_CACHE_TAG);
}

export async function getGroupOptions(facultyIds: number[]) {
  const query = queryString.stringify({ faculties: facultyIds }, { arrayFormat: 'none' });
  const response = await apiFetch(`/mail/group-options?${query}`);
  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as Group[];
}

export async function getStudentOptions(groups: number[]) {
  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    return [];
  }

  const query = queryString.stringify({ groups }, { arrayFormat: 'none' });
  const response = await apiFetch(`/mail/student-options?${query}`);
  if (!response.ok) {
    throwApiError(response.status);
  }
  return (await response.json()) as EntityIdName[];
}

export async function getEmployeeOptions(search: string) {
  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    try {
      const localUser = await getLocalUserLite();
      if (!localUser) return [];

      const schoolFilter = localUser.schoolId ? { schoolId: localUser.schoolId } : {};

      const users = await prisma.user.findMany({
        where: {
          role: { in: ['TEACHER', 'ADMIN'] },
          fullName: { contains: search },
          ...schoolFilter,
        },
        select: { id: true, fullName: true, username: true },
        take: 20,
      });
      return users.map((u) => ({ id: u.id, name: u.fullName || u.username }));
    } catch {
      return [];
    }
  }

  const response = await apiFetch(`/mail/employee-options?search=${search}`);
  if (!response.ok) {
    throwApiError(response.status);
  }
  return (await response.json()) as EntityIdName[];
}

export async function getParentOptionsForTeacher() {
  const localUser = await getLocalUserLite();
  if (!localUser || (localUser.role !== 'TEACHER' && localUser.role !== 'ADMIN')) {
    return [];
  }

  try {
    const schoolFilter = localUser.schoolId ? { schoolId: localUser.schoolId } : {};

    if (localUser.role === 'ADMIN') {
      const parents = await prisma.user.findMany({
        where: { role: 'PARENT', ...schoolFilter },
        select: { id: true, fullName: true, username: true },
        orderBy: { fullName: 'asc' },
      });
      return parents.map((p: { id: number; fullName: string; username: string }) => ({
        id: p.id,
        name: p.fullName || p.username,
      }));
    }

    const teacherCourses = await prisma.course.findMany({
      where: { teacherId: localUser.id },
      select: { userId: true },
    });

    const studentIds = [...new Set(teacherCourses.map((c: { userId: number }) => c.userId))];

    if (studentIds.length === 0) return [];

    const parentRelations = await prisma.parentStudent.findMany({
      where: { studentId: { in: studentIds } },
      include: {
        parent: {
          select: { id: true, fullName: true, username: true },
        },
      },
    });

    const uniqueParents = new Map<number, { id: number; name: string }>();
    for (const rel of parentRelations) {
      if (!uniqueParents.has(rel.parent.id)) {
        uniqueParents.set(rel.parent.id, {
          id: rel.parent.id,
          name: rel.parent.fullName || rel.parent.username,
        });
      }
    }

    return Array.from(uniqueParents.values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

type SendMailParams = {
  recipients: number[];
  subject: string;
  content: string;
};

const sendMailSchema = z.object({
  recipients: z.array(z.number().int().positive()).min(1).max(100),
  subject: z.string().min(1).max(255),
  content: z.string().min(1).max(10000),
});

/**
 * @throws {ValidationError} If recipients, subject, or content are invalid.
 * @throws {ActionError} On API failure.
 */
export async function sendMail(params: SendMailParams) {
  await requireCsrf();
  const validated = validateInput(sendMailSchema, params, 'sendMail');

  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    const user = await getLocalUserLite();
    if (!user) throw new Error('Unauthorized');

    const recipients = await prisma.user.findMany({
      where: { id: { in: validated.recipients } },
      select: { id: true, schoolId: true },
    });

    const validRecipientIds = user.schoolId
      ? recipients.filter((r) => r.schoolId === user.schoolId).map((r) => r.id)
      : recipients.map((r) => r.id);

    if (validRecipientIds.length === 0) {
      throw new Error('No valid recipients found');
    }

    await prisma.notification.createMany({
      data: validRecipientIds.map((recipientId: number) => ({
        userId: recipientId,
        senderId: user.id,
        title: validated.subject,
        message: validated.content,
        type: 'mail',
      })),
    });
    revalidateTag(MESSAGES_CACHE_TAG);
    return true;
  }

  const response = await apiFetch('/mail', {
    method: 'POST',
    body: JSON.stringify(validated),
  });

  if (!response.ok) {
    throwApiError(response.status);
  }
  return true;
}

/**
 * @returns Safe default on error: 0. Never throws.
 */
export async function getUnreadMailCount() {
  if (env.NEXT_PUBLIC_LOCAL_AUTH === 'true') {
    try {
      const user = await getLocalUserLite();
      if (!user) return 0;
      return await prisma.notification.count({
        where: { userId: user.id, read: false },
      });
    } catch {
      return 0;
    }
  }

  try {
    const response = await apiFetch('/mail?filter=incoming', {
      next: { revalidate: 60, tags: [MESSAGES_CACHE_TAG] },
    });
    if (!response.ok) return 0;
    const mails = (await response.json()) as Message[];
    return mails.filter((m) => !m.isRead).length;
  } catch {
    return 0;
  }
}

/**
 * Send a message to parent users via local notifications.
 * Uses the Notification model to deliver messages to parents.
 * @throws {ActionError} If user is not authorized or send fails.
 */
export async function sendMailToParents(params: SendMailParams): Promise<boolean> {
  await requireCsrf();
  const localUser = await getLocalUserLite();
  if (!localUser || (localUser.role !== 'TEACHER' && localUser.role !== 'ADMIN')) {
    throwApiError(403);
    return false;
  }

  const validated = validateInput(sendMailSchema, params, 'sendMailToParents');

  try {
    const validRecipients = localUser.schoolId
      ? await prisma.user.findMany({
          where: { id: { in: validated.recipients }, schoolId: localUser.schoolId, role: 'PARENT' },
          select: { id: true },
        })
      : await prisma.user.findMany({
          where: { id: { in: validated.recipients }, role: 'PARENT' },
          select: { id: true },
        });

    if (validRecipients.length === 0) {
      throw new Error('No valid parent recipients found');
    }

    await prisma.notification.createMany({
      data: validRecipients.map((r: { id: number }) => ({
        userId: r.id,
        title: validated.subject,
        message: validated.content,
        type: 'parent-message',
        senderId: localUser.id,
      })),
    });

    revalidateTag(MESSAGES_CACHE_TAG);
    return true;
  } catch {
    throwApiError(500);
    return false;
  }
}

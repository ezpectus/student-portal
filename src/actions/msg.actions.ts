'use server';

import { revalidateTag } from 'next/cache';
import queryString from 'query-string';

import { z } from 'zod';

import { apiFetch } from '@/lib/client';
import { throwApiError } from '@/lib/api-error';
import { validateInput } from '@/lib/validate';
import { MESSAGES_CACHE_TAG } from '@/lib/constants/cache-tags';
import { MailFilter } from '@/types/enums/mail-filter';
import { EntityIdName } from '@/types/models/entity-id-name';
import { Group } from '@/types/models/group';
import { Message } from '@/types/models/message';

/**
 * @throws {ActionError} On API failure.
 */
export async function getMails(filter: MailFilter = MailFilter.Incoming) {
  const response = await apiFetch<Message[]>(`/mail?filter=${filter}`, {
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
  const response = await apiFetch<Message>(`/mail/${mailId}`, {
    next: { revalidate: 300, tags: [MESSAGES_CACHE_TAG] },
  });
  if (!response.ok) {
    throwApiError(response.status);
  }
  return (await response.json()) as Message;
}

export async function getFacultyOptions() {
  const response = await apiFetch<EntityIdName[]>('/mail/faculty-options');
  if (!response.ok) {
    throwApiError(response.status);
  }
  return (await response.json()) as EntityIdName[];
}

export async function getAllGroups() {
  const allFaculties = await getFacultyOptions();
  const allFacultiesIds = allFaculties.map((faculty) => faculty.id);
  const query = queryString.stringify({ faculties: allFacultiesIds }, { arrayFormat: 'none' });
  const response = await apiFetch<EntityIdName[]>(`/mail/group-options?${query}`);
  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as EntityIdName[];
}

export async function deleteMail(mailIds: number[], deleteForRecipient: boolean) {
  const query = queryString.stringify(
    { mailIds: mailIds, deleteForRecipient: deleteForRecipient },
    { arrayFormat: 'none' },
  );

  const response = await apiFetch<Message>(`/mail?${query}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throwApiError(response.status);
  }

  revalidateTag(MESSAGES_CACHE_TAG);
}

export async function markAsImportant(mailIds: number[], isImportant: boolean) {
  const response = await apiFetch<Message>(`/mail/important`, {
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
  const response = await apiFetch<Group[]>(`/mail/group-options?${query}`);
  if (!response.ok) {
    throwApiError(response.status);
  }

  return (await response.json()) as Group[];
}

export async function getStudentOptions(groups: number[]) {
  const query = queryString.stringify({ groups }, { arrayFormat: 'none' });
  const response = await apiFetch<EntityIdName[]>(`/mail/student-options?${query}`);
  if (!response.ok) {
    throwApiError(response.status);
  }
  return (await response.json()) as EntityIdName[];
}

export async function getEmployeeOptions(search: string) {
  const response = await apiFetch<EntityIdName[]>(`/mail/employee-options?search=${search}`);
  if (!response.ok) {
    throwApiError(response.status);
  }
  return (await response.json()) as EntityIdName[];
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
  const validated = validateInput(sendMailSchema, params, 'sendMail');

  const response = await apiFetch<Message>('/mail', {
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
  try {
    const response = await apiFetch<Message[]>('/mail?filter=incoming', {
      next: { revalidate: 60, tags: [MESSAGES_CACHE_TAG] },
    });
    if (!response.ok) return 0;
    const mails = (await response.json()) as Message[];
    return mails.filter((m) => !m.isRead).length;
  } catch {
    return 0;
  }
}

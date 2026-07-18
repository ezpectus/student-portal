'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

import { z } from 'zod';

import { apiFetch } from '@/lib/client';
import { throwApiError } from '@/lib/api-error';
import { validateInput } from '@/lib/validate';
import { ANNOUNCEMENTS_CACHE_TAG } from '@/lib/constants/cache-tags';
import { isOutdated } from '@/lib/date.utils';
import { retryWithBackoff } from '@/lib/retry';
import { LOCALE } from '@/i18n/routing';
import { AdminAnnouncementItem, Announcement } from '@/types/models/announcement';
import { AnnouncementCreate } from '@/app/[locale]/(private)/module/announcementseditor/types';

// URL pathname (no [locale] prefix, no route group). Matches the convention
// used by other actions in the repo, e.g. certificates.actions revalidating
// `/module/certificates`.
const ANNOUNCEMENTS_EDITOR_PATH = '/module/announcementseditor';

export interface AdminAnnouncementsQuery {
  search?: string;
  language?: LOCALE;
  page?: number;
  pageSize?: number;
}

export interface AdminAnnouncementsResult {
  items: AdminAnnouncementItem[];
  total: number;
}

export const getAdminAnnouncements = async (query: AdminAnnouncementsQuery): Promise<AdminAnnouncementsResult> => {
  try {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.language) {
      // Backend enum is PascalCase (Uk/En); the model binder is case-insensitive.
      params.set('language', query.language);
    }
    if (query.page) params.set('page', String(query.page));
    if (query.pageSize) params.set('pageSize', String(query.pageSize));

    const qs = params.toString();
    const url = qs ? `announcements/admin?${qs}` : 'announcements/admin';
    const response = await apiFetch<AdminAnnouncementItem[]>(url, {
      next: { revalidate: 300, tags: [ANNOUNCEMENTS_CACHE_TAG] },
    });

    if (!response.ok) {
      return { items: [], total: 0 };
    }

    const items = (await response.json()) as AdminAnnouncementItem[];
    const total = parseInt(response.headers.get('x-total-count') ?? '0', 10) || 0;

    return { items, total };
  } catch {
    return { items: [], total: 0 };
  }
};

export const getAdminAnnouncementById = async (id: number): Promise<AdminAnnouncementItem> => {
  try {
    const response = await apiFetch<AdminAnnouncementItem>(`announcements/admin/${id}`);

    if (!response.ok) {
      throwApiError(response.status, 'getAdminAnnouncementById');
    }

    return (await response.json()) as AdminAnnouncementItem;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch announcement');
  }
};

export const getAnnouncements = async ({ excludeOutdated = false }: { excludeOutdated?: boolean } = {}) => {
  try {
    const response = await retryWithBackoff(() => apiFetch<Announcement[]>('announcements', {
      next: { revalidate: 300, tags: [ANNOUNCEMENTS_CACHE_TAG] },
    }), {
      maxAttempts: 2,
      baseDelayMs: 200,
    });

    if (!response.ok) {
      return [];
    }

    const announcements = (await response.json()) as Announcement[];

    const sortedAnnouncements = announcements.sort((a, b) => {
      return new Date(b.end || 0).getTime() - new Date(a.end || 0).getTime();
    });

    if (excludeOutdated) {
      return sortedAnnouncements.filter((announcement) => !isOutdated(announcement.end));
    }

    return sortedAnnouncements;
  } catch {
    return [];
  }
};

const announcementCreateSchema = z.object({
  announcement: z.object({
    title: z.string().min(1).max(255),
    description: z.string().min(1).max(5000),
    image: z.string().url().nullable(),
    link: z.object({ title: z.string().max(255), uri: z.string().url() }).nullable(),
    start: z.string().min(1),
    end: z.string().min(1),
    language: z.string().min(1).max(10),
  }),
  filter: z.object({
    courses: z.array(z.number().int().positive()),
    roles: z.array(z.string().max(100)),
    studyForms: z.array(z.string().max(100)),
  }),
});

const announcementIdSchema = z.object({
  id: z.number().int().positive(),
});

export const createAnnouncement = async (data: AnnouncementCreate): Promise<number> => {
  const validated = validateInput(announcementCreateSchema, data, 'createAnnouncement');

  const response = await apiFetch('announcements', {
    method: 'POST',
    body: JSON.stringify(validated),
  });

  if (!response.ok) {
    throwApiError(response.status, 'createAnnouncement');
  }

  const responseJson = (await response.json()) as number;
  revalidateTag(ANNOUNCEMENTS_CACHE_TAG);
  revalidatePath(ANNOUNCEMENTS_EDITOR_PATH, 'layout');
  return responseJson;
};

export const updateAnnouncement = async (id: number, data: AnnouncementCreate): Promise<void> => {
  const validatedId = validateInput(announcementIdSchema, { id }, 'updateAnnouncement');
  const validatedData = validateInput(announcementCreateSchema, data, 'updateAnnouncement');

  const response = await apiFetch(`announcements/${validatedId.id}`, {
    method: 'PUT',
    body: JSON.stringify(validatedData),
  });

  if (!response.ok) {
    throwApiError(response.status, 'updateAnnouncement');
  }
  revalidateTag(ANNOUNCEMENTS_CACHE_TAG);
  revalidatePath(ANNOUNCEMENTS_EDITOR_PATH, 'layout');
};

export const deleteAnnouncement = async (id: number): Promise<void> => {
  const validated = validateInput(announcementIdSchema, { id }, 'deleteAnnouncement');

  const response = await apiFetch(`announcements/${validated.id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throwApiError(response.status, 'deleteAnnouncement');
  }
  revalidateTag(ANNOUNCEMENTS_CACHE_TAG);
  revalidatePath(ANNOUNCEMENTS_EDITOR_PATH, 'layout');
};

export const getRoles = async () => {
  try {
    const response = await apiFetch<string[]>('roles');
    if (!response.ok) {
      return [];
    }
    return (await response.json()) as string[];
  } catch {
    return [];
  }
};

export const getStudyForms = async () => {
  try {
    const response = await apiFetch<string[]>('study-forms');
    if (!response.ok) {
      return [];
    }
    return (await response.json()) as string[];
  } catch {
    return [];
  }
};

export const getCourses = async () => {
  try {
    const response = await apiFetch<number[]>('courses');
    if (!response.ok) {
      return [];
    }
    return (await response.json()) as number[];
  } catch {
    return [];
  }
};

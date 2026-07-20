'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getLocalUserLite } from '@/actions/local-user.actions';
import { requireCsrf } from '@/lib/csrf';
import { prisma } from '@/lib/prisma';

const CALENDAR_PATH = '/module/calendar';

const getLocalUserId = async () => {
  const user = await getLocalUserLite();
  return user;
};

export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  location: string | null;
  type: string;
  createdBy: number;
  createdByName: string;
}

export interface CalendarEventData {
  id: number;
  title: string;
  description: string;
  start: Date;
  end: Date | null;
  location: string;
  type: string;
}

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
  description: z.string().max(2000, 'Description must be at most 2000 characters').optional().default(''),
  startDate: z.string().min(1, 'Start date is required').refine((s) => !Number.isNaN(Date.parse(s)), {
    message: 'Must be a valid ISO date',
  }),
  endDate: z.string().optional().refine((s) => !s || !Number.isNaN(Date.parse(s)), {
    message: 'Must be a valid ISO date',
  }),
  location: z.string().max(200, 'Location must be at most 200 characters').optional().default(''),
  type: z.enum(['general', 'exam', 'conference', 'holiday', 'deadline']).default('general'),
});

const eventIdSchema = z.object({
  id: z.number().int().positive(),
});

export const getEvents = async (): Promise<CalendarEvent[]> => {
  const user = await getLocalUserId();
  if (!user) return [];

  try {
    const schoolFilter = user.schoolId ? { schoolId: user.schoolId } : {};
    const events = await prisma.event.findMany({
      where: schoolFilter,
      include: {
        createdByUser: {
          select: { fullName: true, username: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      startDate: e.startDate.toISOString(),
      endDate: e.endDate?.toISOString() ?? null,
      location: e.location,
      type: e.type,
      createdBy: e.createdBy,
      createdByName: e.createdByUser.fullName || e.createdByUser.username,
    }));
  } catch {
    return [];
  }
};

export const getEventById = async (id: number): Promise<CalendarEventData | null> => {
  const user = await getLocalUserId();
  if (!user) return null;

  try {
    const validated = eventIdSchema.parse({ id });
    const event = await prisma.event.findFirst({
      where: {
        id: validated.id,
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
      },
    });

    if (!event) return null;

    return {
      id: event.id,
      title: event.title,
      description: event.description ?? '',
      start: event.startDate,
      end: event.endDate,
      location: event.location ?? '',
      type: event.type,
    };
  } catch {
    return null;
  }
};

export const createEvent = async (data: z.infer<typeof eventSchema>): Promise<number> => {
  await requireCsrf();
  const user = await getLocalUserId();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
    throw new Error('Only admins and teachers can create events');
  }

  const validated = eventSchema.parse(data);

  const event = await prisma.event.create({
    data: {
      title: validated.title,
      description: validated.description || null,
      startDate: new Date(validated.startDate),
      endDate: validated.endDate ? new Date(validated.endDate) : null,
      location: validated.location || null,
      type: validated.type,
      createdBy: user.id,
      schoolId: user.schoolId ?? null,
    },
  });

  revalidatePath(CALENDAR_PATH);
  return event.id;
};

export const updateEvent = async (id: number, data: z.infer<typeof eventSchema>): Promise<void> => {
  await requireCsrf();
  const user = await getLocalUserId();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
    throw new Error('Only admins and teachers can update events');
  }

  const validatedId = eventIdSchema.parse({ id });
  const validated = eventSchema.parse(data);

  const existing = await prisma.event.findFirst({
    where: { id: validatedId.id, ...(user.schoolId ? { schoolId: user.schoolId } : {}) },
    select: { createdBy: true },
  });

  if (!existing) {
    throw new Error('Event not found');
  }

  if (user.role !== 'ADMIN' && existing.createdBy !== user.id) {
    throw new Error('You can only edit your own events');
  }

  await prisma.event.update({
    where: { id: validatedId.id },
    data: {
      title: validated.title,
      description: validated.description || null,
      startDate: new Date(validated.startDate),
      endDate: validated.endDate ? new Date(validated.endDate) : null,
      location: validated.location || null,
      type: validated.type,
    },
  });

  revalidatePath(CALENDAR_PATH);
};

export const deleteEvent = async (id: number): Promise<void> => {
  await requireCsrf();
  const user = await getLocalUserId();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'TEACHER')) {
    throw new Error('Only admins and teachers can delete events');
  }

  const validated = eventIdSchema.parse({ id });

  const existing = await prisma.event.findFirst({
    where: { id: validated.id, ...(user.schoolId ? { schoolId: user.schoolId } : {}) },
    select: { createdBy: true },
  });

  if (!existing) {
    throw new Error('Event not found');
  }

  if (user.role !== 'ADMIN' && existing.createdBy !== user.id) {
    throw new Error('You can only delete your own events');
  }

  await prisma.event.delete({
    where: { id: validated.id },
  });

  revalidatePath(CALENDAR_PATH);
};

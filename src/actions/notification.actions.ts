'use server';

import { getLocalUser } from '@/actions/local-auth.actions';
import { prisma } from '@/lib/prisma';

const getLocalUserId = async () => {
  const user = await getLocalUser();
  return user?.id ?? null;
};

export async function getNotifications() {
  const userId = await getLocalUserId();
  if (!userId) return { items: [], unreadCount: 0 };

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        read: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return { items, unreadCount };
}

export async function markNotificationRead(id: number) {
  const userId = await getLocalUserId();
  if (!userId) return { ok: false };

  const result = await prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });

  return { ok: result.count === 1 };
}

export async function markAllNotificationsRead() {
  const userId = await getLocalUserId();
  if (!userId) return { ok: false };

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return { ok: true };
}

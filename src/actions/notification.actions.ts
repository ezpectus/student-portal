'use server';

import { getLocalUserLite } from '@/actions/local-user.actions';
import { requireCsrf } from '@/lib/csrf';
import { prisma } from '@/lib/prisma';

const getLocalUserId = async () => {
  const user = await getLocalUserLite();
  return user?.id ?? null;
};

export async function getNotifications(page: number = 1, pageSize: number = 20) {
  const userId = await getLocalUserId();
  if (!userId) return { items: [], unreadCount: 0, total: 0 };

  const skip = (page - 1) * pageSize;

  const [items, unreadCount, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        read: true,
        createdAt: true,
        senderId: true,
        sender: { select: { id: true, fullName: true, photo: true } },
      },
    }),
    prisma.notification.count({ where: { userId, read: false } }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return { items, unreadCount, total };
}

export async function markNotificationRead(id: number) {
  await requireCsrf();
  const userId = await getLocalUserId();
  if (!userId) return { ok: false };

  const result = await prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });

  return { ok: result.count === 1 };
}
export async function markAllNotificationsRead() {
  await requireCsrf();
  const userId = await getLocalUserId();
  if (!userId) return { ok: false };

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });

  return { ok: true };
}

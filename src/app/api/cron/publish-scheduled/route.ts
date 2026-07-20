import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { getAdminAnnouncements } from '@/actions/announcement.actions';
import { apiFetch } from '@/lib/client';
import { ANNOUNCEMENTS_CACHE_TAG } from '@/lib/constants/cache-tags';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();

    const { items } = await getAdminAnnouncements({ page: 1, pageSize: 100 });

    const scheduledItems = items.filter(
      (item) =>
        item.announcement.scheduledAt &&
        item.announcement.scheduledAt <= now &&
        !item.announcement.isPublished,
    );

    let publishedCount = 0;
    for (const item of scheduledItems) {
      try {
        const response = await apiFetch(`announcements/${item.announcement.id}/publish`, {
          method: 'PATCH',
        });
        if (response.ok) {
          publishedCount++;
        }
      } catch {
        continue;
      }
    }

    if (publishedCount > 0) {
      revalidateTag(ANNOUNCEMENTS_CACHE_TAG);
    }

    return NextResponse.json({
      status: 'ok',
      published: publishedCount,
      checked: items.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process scheduled announcements', detail: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

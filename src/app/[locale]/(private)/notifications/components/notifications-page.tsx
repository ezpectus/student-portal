'use client';

import { Bell, Check,CheckCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/actions/notification.actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
  senderId: number | null;
  sender: { id: number; fullName: string; photo: string } | null;
}

interface NotificationsPageProps {
  initialItems: NotificationItem[];
  initialUnreadCount: number;
  total: number;
  pageSize: number;
}

const TYPE_COLORS: Record<string, string> = {
  important: 'bg-red-500/10 text-red-600 border-red-500/20',
  mail: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'parent-message': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  announcement: 'bg-green-500/10 text-green-600 border-green-500/20',
  'password-reset': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  info: 'bg-muted text-muted-foreground border-border',
};

function formatRelativeDate(date: Date, locale: string): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return locale === 'uk' ? 'щойно' : 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return new Date(date).toLocaleDateString(locale);
}

export function NotificationsPage({ initialItems, initialUnreadCount, total, pageSize }: NotificationsPageProps) {
  const t = useTranslations('private.notifications');
  const locale = useLocale();

  const [items, setItems] = useState<NotificationItem[]>(initialItems);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loading, setLoading] = useState(false);
  const [loadedCount, setLoadedCount] = useState(initialItems.length);

  const hasMore = loadedCount < total;

  const handleRead = async (id: number) => {
    const result = await markNotificationRead(id);
    if (!result.ok) return;
    setItems((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const handleReadAll = async () => {
    const result = await markAllNotificationsRead();
    if (!result.ok) return;
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  };

  const handleLoadMore = useCallback(async () => {
    setLoading(true);
    const nextPage = Math.floor(loadedCount / pageSize) + 1;
    const result = await getNotifications(nextPage, pageSize);
    setItems((current) => [...current, ...result.items]);
    setLoadedCount((count) => count + result.items.length);
    setLoading(false);
  }, [loadedCount, pageSize]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{t('page-title')}</h1>
          {unreadCount > 0 && (
            <Badge variant="error" className="text-xs">
              {t('unread', { count: unreadCount })}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="tertiary" size="small" onClick={() => void handleReadAll()}>
            <CheckCheck size={16} className="mr-1" />
            {t('mark-all')}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12">
          <Bell size={40} className="mb-4 text-muted-foreground" />
          <p className="text-center text-sm text-muted-foreground">{t('empty')}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`flex items-start gap-3 p-4 transition-colors hover:bg-muted/50 ${
                !item.read ? 'border-l-4 border-l-basic-blue' : ''
              }`}
            >
              <Avatar className="h-10 w-10 shrink-0">
                {item.sender?.photo ? (
                  <AvatarImage src={item.sender.photo} alt={item.sender.fullName} />
                ) : null}
                <AvatarFallback>
                  {item.sender ? item.sender.fullName.charAt(0).toUpperCase() : <Bell size={16} />}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.title}</span>
                  <Badge
                    variant="neutral"
                    className={`shrink-0 border text-[10px] ${TYPE_COLORS[item.type] ?? TYPE_COLORS.info}`}
                  >
                    {t(`types.${item.type}`, { defaultMessage: item.type })}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  {item.sender && (
                    <span>
                      {t('from')}: {item.sender.fullName}
                    </span>
                  )}
                  <span>{formatRelativeDate(item.createdAt, locale)}</span>
                </div>
              </div>

              {!item.read && (
                <Button
                  variant="tertiary"
                  size="small"
                  className="shrink-0"
                  onClick={() => void handleRead(item.id)}
                  aria-label={t('mark-read')}
                >
                  <Check size={16} />
                </Button>
              )}
            </Card>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="secondary" onClick={() => void handleLoadMore()} disabled={loading}>
                {loading ? <Skeleton className="h-4 w-20" /> : t('show-more')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

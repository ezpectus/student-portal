'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/actions/notification.actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
}

export const NotificationCenter = () => {
  const t = useTranslations('private.notifications');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    const result = await getNotifications();
    setItems(result.items);
    setUnreadCount(result.unreadCount);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const result = await getNotifications();
      if (cancelled) return;
      setItems(result.items);
      setUnreadCount(result.unreadCount);
    };

    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const handleRead = async (id: number) => {
    const result = await markNotificationRead(id);
    if (!result.ok) return;
    setItems((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const handleReadAll = async () => {
    const result = await markAllNotificationsRead();
    if (!result.ok) return;
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="tertiary" size="small" className="relative" aria-label={t('open')}>
          <Bell size={18} />
          {unreadCount > 0 && (
            <Badge variant="error" className="absolute -right-1 -top-1 min-w-4 justify-center px-1 text-[10px]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{t('title')}</p>
            <p className="text-xs text-muted-foreground">{t('unread', { count: unreadCount })}</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="tertiary" size="small" onClick={handleReadAll} aria-label={t('mark-all')}>
              <CheckCheck size={16} />
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
          ) : items.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => void handleRead(item.id)}
              className="block w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted"
            >
              <div className="flex items-start gap-2">
                {!item.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-basic-blue" />}
                <span className={item.read ? 'pl-4' : ''}>
                  <span className="block text-sm font-medium">{item.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{item.message}</span>
                </span>
              </div>
            </button>
          ))}
        </div>
        <div className="border-t border-border px-4 py-2 text-right">
          <Button variant="tertiary" size="small" onClick={() => void refresh()}>{t('refresh')}</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

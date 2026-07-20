'use client';

import { useTranslations } from 'next-intl';
import { memo } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatMessageItem {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  senderPhoto: string;
  createdAt: Date;
  isOwn: boolean;
}

interface Props {
  messages: ChatMessageItem[];
  isLoading: boolean;
}

export const ChatMessageList = memo(function ChatMessageList({ messages, isLoading }: Props) {
  const t = useTranslations('private.chat');

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-3/4" />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground text-sm">{t('no-messages')}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 rounded-lg border border-border p-4">
      <div className="flex flex-col gap-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1 ${msg.isOwn ? 'items-end' : 'items-start'}`}
          >
            <span className="text-muted-foreground text-xs">
              {msg.isOwn ? t('you') : msg.senderName}
            </span>
            <div
              className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                msg.isOwn
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
});

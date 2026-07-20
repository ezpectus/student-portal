'use client';

import { useTranslations } from 'next-intl';
import { memo } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatRoom {
  id: number;
  name: string;
  courseId: number | null;
  members: { id: number; name: string; photo: string }[];
  lastMessage: { content: string; senderName: string; createdAt: Date } | null;
}

interface Props {
  rooms: ChatRoom[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  isLoading: boolean;
}

export const ChatRoomList = memo(function ChatRoomList({ rooms, selectedId, onSelect, isLoading }: Props) {
  const t = useTranslations('private.chat');

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">{t('no-rooms')}</p>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-1">
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelect(room.id)}
            className={`flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
              selectedId === room.id ? 'border-primary bg-accent' : 'border-border'
            }`}
          >
            <span className="font-medium text-sm">{room.name}</span>
            {room.lastMessage ? (
              <span className="text-muted-foreground text-xs truncate">
                {room.lastMessage.senderName}: {room.lastMessage.content}
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">{t('no-messages')}</span>
            )}
            <span className="text-muted-foreground text-xs">
              {room.members.length} {t('members')}
            </span>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
});

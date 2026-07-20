'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { createChatRoom,getAvailableChatUsers, getChatMessages, getChatRooms, sendChatMessage } from '@/actions/chat.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useServerErrorToast } from '@/hooks/use-server-error-toast';
import { useToast } from '@/hooks/use-toast';

import { ChatCreateDialog } from './chat-create-dialog';
import { ChatMessageList } from './chat-message-list';
import { ChatRoomList } from './chat-room-list';

interface ChatRoom {
  id: number;
  name: string;
  courseId: number | null;
  members: { id: number; name: string; photo: string }[];
  lastMessage: { content: string; senderName: string; createdAt: Date } | null;
}

interface ChatMessageItem {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  senderPhoto: string;
  createdAt: Date;
  isOwn: boolean;
}

interface AvailableUser {
  id: number;
  name: string;
  role: string;
}

export const ChatContent = () => {
  const t = useTranslations('private.chat');
  const { errorToast } = useServerErrorToast();
  const { toast } = useToast();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);

  useEffect(() => {
    let isCancelled = false;
    getChatRooms().then((result) => {
      if (!isCancelled) {
        setRooms(result as ChatRoom[]);
        setIsLoadingRooms(false);
      }
    });
    return () => { isCancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedRoomId) return;
    let isCancelled = false;
    setIsLoadingMessages(true);
    getChatMessages(selectedRoomId).then((result) => {
      if (!isCancelled) {
        setMessages(result as ChatMessageItem[]);
        setIsLoadingMessages(false);
      }
    });
    return () => { isCancelled = true; };
  }, [selectedRoomId]);

  const handleSendMessage = async () => {
    if (!selectedRoomId || !messageInput.trim()) return;
    setIsSending(true);
    try {
      await sendChatMessage({ roomId: selectedRoomId, content: messageInput.trim() });
      setMessageInput('');
      const refreshed = await getChatMessages(selectedRoomId);
      setMessages(refreshed as ChatMessageItem[]);
    } catch {
      errorToast();
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenCreate = async () => {
    const users = await getAvailableChatUsers();
    setAvailableUsers(users as AvailableUser[]);
    setShowCreateDialog(true);
  };

  const handleCreateRoom = async (name: string, memberIds: number[]) => {
    try {
      await createChatRoom({ name, memberIds });
      toast({ title: t('create.success') });
      setShowCreateDialog(false);
      const refreshed = await getChatRooms();
      setRooms(refreshed as ChatRoom[]);
    } catch {
      errorToast();
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="flex w-72 flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('rooms')}</h2>
          <Button size="small" onClick={handleOpenCreate}>
            {t('create.button')}
          </Button>
        </div>
        <ChatRoomList
          rooms={rooms}
          selectedId={selectedRoomId}
          onSelect={setSelectedRoomId}
          isLoading={isLoadingRooms}
        />
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {selectedRoomId ? (
          <>
            <ChatMessageList messages={messages} isLoading={isLoadingMessages} />
            <div className="flex gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={t('message-placeholder')}
                disabled={isSending}
              />
              <Button onClick={handleSendMessage} loading={isSending} disabled={!messageInput.trim()}>
                {t('send')}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground text-sm">{t('select-room')}</p>
          </div>
        )}
      </div>

      {showCreateDialog && (
        <ChatCreateDialog
          users={availableUsers}
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreateRoom}
        />
      )}
    </div>
  );
};

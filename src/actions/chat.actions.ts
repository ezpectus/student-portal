'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getLocalUserLite } from '@/actions/local-user.actions';
import { requireCsrf } from '@/lib/csrf';
import { prisma } from '@/lib/prisma';
import { validateInput } from '@/lib/validate';

const CHAT_PATH = '/module/chat';

const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
  courseId: z.number().int().positive().optional(),
  memberIds: z.array(z.number().int().positive()).min(1).max(50),
});

const sendMessageSchema = z.object({
  roomId: z.number().int().positive(),
  content: z.string().min(1).max(5000),
});

/**
 * Get all chat rooms for the current user.
 * @returns Safe default on error: []. Never throws.
 */
export async function getChatRooms() {
  const user = await getLocalUserLite();
  if (!user) return [];

  try {
    const memberships = await prisma.chatMember.findMany({
      where: { userId: user.id },
      include: {
        room: {
          include: {
            members: { include: { user: { select: { id: true, fullName: true, photo: true } } } },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: { select: { id: true, fullName: true } } },
            },
          },
        },
      },
      orderBy: { room: { createdAt: 'desc' } },
    });

    return memberships.map((m: { id: number; joinedAt: Date; room: { id: number; name: string; courseId: number | null; members: { user: { id: number; fullName: string; photo: string } }[]; messages: { id: number; content: string; createdAt: Date; sender: { id: number; fullName: string } }[] } }) => ({
      id: m.room.id,
      name: m.room.name,
      courseId: m.room.courseId,
      members: m.room.members.map((mem: { user: { id: number; fullName: string; photo: string } }) => ({
        id: mem.user.id,
        name: mem.user.fullName,
        photo: mem.user.photo,
      })),
      lastMessage: m.room.messages[0]
        ? {
            content: m.room.messages[0].content,
            senderName: m.room.messages[0].sender.fullName,
            createdAt: m.room.messages[0].createdAt,
          }
        : null,
    }));
  } catch {
    return [];
  }
}

/**
 * Get messages for a chat room.
 * @throws {Error} If user is not a member of the room.
 */
export async function getChatMessages(roomId: number) {
  const user = await getLocalUserLite();
  if (!user) throw new Error('Unauthorized');

  try {
    const membership = await prisma.chatMember.findUnique({
      where: { roomId_userId: { roomId, userId: user.id } },
    });
    if (!membership) throw new Error('Not a member of this room');

    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      include: { sender: { select: { id: true, fullName: true, photo: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return messages.map((m: { id: number; content: string; createdAt: Date; senderId: number; sender: { id: number; fullName: string; photo: string } }) => ({
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      senderName: m.sender.fullName,
      senderPhoto: m.sender.photo,
      createdAt: m.createdAt,
      isOwn: m.senderId === user.id,
    }));
  } catch {
    return [];
  }
}

/**
 * Create a new chat room with members.
 * @throws {ValidationError} If inputs are invalid.
 */
export async function createChatRoom(params: z.infer<typeof createRoomSchema>) {
  await requireCsrf();
  const user = await getLocalUserLite();
  if (!user) throw new Error('Unauthorized');

  const validated = validateInput(createRoomSchema, params, 'createChatRoom');

  try {
    const uniqueMemberIds = [...new Set(validated.memberIds.filter((id: number) => id !== user.id))];

    if (uniqueMemberIds.length > 0 && user.schoolId) {
      const validMembers = await prisma.user.findMany({
        where: { id: { in: uniqueMemberIds }, schoolId: user.schoolId },
        select: { id: true },
      });
      const validIds = new Set(validMembers.map((m: { id: number }) => m.id));
      const invalidIds = uniqueMemberIds.filter((id: number) => !validIds.has(id));
      if (invalidIds.length > 0) {
        throw new Error('Some members are not in your school');
      }
    }

    const room = await prisma.chatRoom.create({
      data: {
        name: validated.name,
        courseId: validated.courseId ?? null,
        schoolId: user.schoolId ?? null,
        createdBy: user.id,
        members: {
          create: [
            { userId: user.id },
            ...uniqueMemberIds.map((id: number) => ({ userId: id })),
          ],
        },
      },
    });

    revalidatePath(CHAT_PATH);
    return { id: room.id, name: room.name };
  } catch {
    throw new Error('Failed to create chat room');
  }
}

/**
 * Send a message to a chat room.
 * @throws {ValidationError} If inputs are invalid.
 * @throws {Error} If user is not a member.
 */
export async function sendChatMessage(params: z.infer<typeof sendMessageSchema>) {
  await requireCsrf();
  const user = await getLocalUserLite();
  if (!user) throw new Error('Unauthorized');

  const validated = validateInput(sendMessageSchema, params, 'sendChatMessage');

  try {
    const membership = await prisma.chatMember.findUnique({
      where: { roomId_userId: { roomId: validated.roomId, userId: user.id } },
    });
    if (!membership) throw new Error('Not a member of this room');

    const message = await prisma.chatMessage.create({
      data: {
        content: validated.content,
        roomId: validated.roomId,
        senderId: user.id,
      },
    });

    revalidatePath(CHAT_PATH);
    return { id: message.id, createdAt: message.createdAt };
  } catch {
    throw new Error('Failed to send message');
  }
}

/**
 * Get available users to add to a chat room (same school, not already in room).
 * @returns Safe default on error: []. Never throws.
 */
export async function getAvailableChatUsers(roomId?: number) {
  const user = await getLocalUserLite();
  if (!user) return [];

  try {
    const schoolFilter = user.schoolId ? { schoolId: user.schoolId } : {};

    if (roomId) {
      const existingMembers = await prisma.chatMember.findMany({
        where: { roomId },
        select: { userId: true },
      });
      const existingIds = existingMembers.map((m: { userId: number }) => m.userId);

      const users = await prisma.user.findMany({
        where: { ...schoolFilter, id: { notIn: [...existingIds, user.id] } },
        select: { id: true, fullName: true, role: true },
        take: 50,
      });

      return users.map((u: { id: number; fullName: string; role: string }) => ({
        id: u.id,
        name: u.fullName,
        role: u.role,
      }));
    }

    const users = await prisma.user.findMany({
      where: { ...schoolFilter, id: { not: user.id } },
      select: { id: true, fullName: true, role: true },
      take: 50,
    });

    return users.map((u: { id: number; fullName: string; role: string }) => ({
      id: u.id,
      name: u.fullName,
      role: u.role,
    }));
  } catch {
    return [];
  }
}

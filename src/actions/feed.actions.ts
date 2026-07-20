'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getLocalUserLite } from '@/actions/local-user.actions';
import { requireCsrf } from '@/lib/csrf';
import { prisma } from '@/lib/prisma';
import { validateInput } from '@/lib/validate';

const FEED_PATH = '/module/feed';

const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
  imageUrl: z.string().url().startsWith('https://').optional().or(z.literal('')),
});

const createCommentSchema = z.object({
  postId: z.number().int().positive(),
  content: z.string().min(1).max(1000),
});

export interface FeedPostItem {
  id: number;
  content: string;
  imageUrl: string | null;
  authorId: number;
  authorName: string;
  authorPhoto: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  comments: {
    id: number;
    content: string;
    authorName: string;
    authorId: number;
    createdAt: string;
  }[];
}

export async function getFeedPosts(): Promise<FeedPostItem[]> {
  const user = await getLocalUserLite();
  if (!user) return [];

  try {
    const schoolFilter = user.schoolId ? { schoolId: user.schoolId } : {};
    const posts = await prisma.feedPost.findMany({
      where: schoolFilter,
      include: {
        author: { select: { id: true, fullName: true, photo: true } },
        comments: {
          include: { author: { select: { id: true, fullName: true } } },
          orderBy: { createdAt: 'asc' },
        },
        likes: { where: { userId: user.id }, select: { id: true } },
        _count: { select: { likes: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return posts.map((p) => ({
      id: p.id,
      content: p.content,
      imageUrl: p.imageUrl,
      authorId: p.authorId,
      authorName: p.author.fullName,
      authorPhoto: p.author.photo,
      createdAt: p.createdAt.toISOString(),
      likeCount: p._count.likes,
      likedByMe: p.likes.length > 0,
      comments: p.comments.map((c) => ({
        id: c.id,
        content: c.content,
        authorName: c.author.fullName,
        authorId: c.authorId,
        createdAt: c.createdAt.toISOString(),
      })),
    }));
  } catch {
    return [];
  }
}

export async function createFeedPost(params: z.infer<typeof createPostSchema>): Promise<void> {
  await requireCsrf();
  const user = await getLocalUserLite();
  if (!user) throw new Error('Unauthorized');

  const validated = validateInput(createPostSchema, params, 'createFeedPost');

  await prisma.feedPost.create({
    data: {
      content: validated.content,
      imageUrl: validated.imageUrl || null,
      authorId: user.id,
      schoolId: user.schoolId ?? null,
    },
  });

  revalidatePath(FEED_PATH);
}

export async function deleteFeedPost(postId: number): Promise<void> {
  await requireCsrf();
  const user = await getLocalUserLite();
  if (!user) throw new Error('Unauthorized');

  const post = await prisma.feedPost.findFirst({
    where: {
      id: postId,
      ...(user.schoolId ? { schoolId: user.schoolId } : {}),
    },
    select: { authorId: true },
  });

  if (!post) throw new Error('Post not found');
  if (post.authorId !== user.id && user.role !== 'ADMIN') {
    throw new Error('Not allowed to delete this post');
  }

  await prisma.feedPost.delete({ where: { id: postId } });
  revalidatePath(FEED_PATH);
}

export async function createFeedComment(params: z.infer<typeof createCommentSchema>): Promise<void> {
  await requireCsrf();
  const user = await getLocalUserLite();
  if (!user) throw new Error('Unauthorized');

  const validated = validateInput(createCommentSchema, params, 'createFeedComment');

  await prisma.feedComment.create({
    data: {
      content: validated.content,
      postId: validated.postId,
      authorId: user.id,
    },
  });

  revalidatePath(FEED_PATH);
}

export async function toggleFeedLike(postId: number): Promise<void> {
  await requireCsrf();
  const user = await getLocalUserLite();
  if (!user) throw new Error('Unauthorized');

  const existing = await prisma.feedLike.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
  });

  if (existing) {
    await prisma.feedLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.feedLike.create({
      data: { postId, userId: user.id },
    });
  }

  revalidatePath(FEED_PATH);
}

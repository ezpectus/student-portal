import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    feedPost: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    feedComment: {
      create: vi.fn(),
    },
    feedLike: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/actions/local-user.actions', () => ({
  getLocalUserLite: vi.fn(),
}));

vi.mock('@/lib/csrf', () => ({
  requireCsrf: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/validate', () => ({
  validateInput: vi.fn((schema, data) => schema.parse(data)),
}));

import { revalidatePath } from 'next/cache';

import { createFeedComment, createFeedPost, deleteFeedPost, getFeedPosts, toggleFeedLike } from '@/actions/feed.actions';
import { getLocalUserLite } from '@/actions/local-user.actions';
import { prisma } from '@/lib/prisma';

const mockPrisma = vi.mocked(prisma) as unknown as {
  feedPost: {
    findMany: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  feedComment: { create: ReturnType<typeof vi.fn> };
  feedLike: {
    findUnique: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
};
const mockGetLocalUserLite = vi.mocked(getLocalUserLite);

describe('getFeedPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when user is not logged in', async () => {
    mockGetLocalUserLite.mockResolvedValue(null);

    const result = await getFeedPosts();

    expect(result).toEqual([]);
    expect(mockPrisma.feedPost.findMany).not.toHaveBeenCalled();
  });

  it('returns posts with like and comment data', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    const date = new Date('2025-01-01');
    mockPrisma.feedPost.findMany.mockResolvedValue([
      {
        id: 10,
        content: 'Hello',
        imageUrl: null,
        authorId: 1,
        author: { id: 1, fullName: 'Alice', photo: '' },
        comments: [
          { id: 1, content: 'Hi', authorId: 2, author: { id: 2, fullName: 'Bob' }, createdAt: date },
        ],
        likes: [{ id: 1 }],
        _count: { likes: 3 },
        createdAt: date,
      },
    ] as never);

    const result = await getFeedPosts();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 10,
      content: 'Hello',
      authorName: 'Alice',
      likeCount: 3,
      likedByMe: true,
    });
    expect(result[0].comments).toHaveLength(1);
    expect(result[0].comments[0].authorName).toBe('Bob');
  });

  it('returns empty array on database error', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.feedPost.findMany.mockRejectedValue(new Error('DB error'));

    const result = await getFeedPosts();

    expect(result).toEqual([]);
  });
});

describe('createFeedPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when user is not logged in', async () => {
    mockGetLocalUserLite.mockResolvedValue(null);

    await expect(createFeedPost({ content: 'test' })).rejects.toThrow('Unauthorized');
  });

  it('creates a post and revalidates path', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.feedPost.create.mockResolvedValue({} as never);

    await createFeedPost({ content: 'Hello world', imageUrl: '' });

    expect(mockPrisma.feedPost.create).toHaveBeenCalledWith({
      data: { content: 'Hello world', imageUrl: null, authorId: 1, schoolId: 1 },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/module/feed');
  });
});

describe('deleteFeedPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when post not found', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.feedPost.findFirst.mockResolvedValue(null);

    await expect(deleteFeedPost(999)).rejects.toThrow('Post not found');
  });

  it('throws when non-author non-admin tries to delete', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.feedPost.findFirst.mockResolvedValue({ authorId: 2 } as never);

    await expect(deleteFeedPost(1)).rejects.toThrow('Not allowed to delete this post');
  });

  it('allows admin to delete any post', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'ADMIN', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.feedPost.findFirst.mockResolvedValue({ authorId: 2 } as never);
    mockPrisma.feedPost.delete.mockResolvedValue({} as never);

    await deleteFeedPost(1);

    expect(mockPrisma.feedPost.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(revalidatePath).toHaveBeenCalledWith('/module/feed');
  });

  it('allows author to delete own post', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.feedPost.findFirst.mockResolvedValue({ authorId: 1 } as never);
    mockPrisma.feedPost.delete.mockResolvedValue({} as never);

    await deleteFeedPost(1);

    expect(mockPrisma.feedPost.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});

describe('createFeedComment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a comment and revalidates', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.feedComment.create.mockResolvedValue({} as never);

    await createFeedComment({ postId: 5, content: 'Nice post' });

    expect(mockPrisma.feedComment.create).toHaveBeenCalledWith({
      data: { content: 'Nice post', postId: 5, authorId: 1 },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/module/feed');
  });
});

describe('toggleFeedLike', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a like when none exists', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.feedLike.findUnique.mockResolvedValue(null);
    mockPrisma.feedLike.create.mockResolvedValue({} as never);

    await toggleFeedLike(5);

    expect(mockPrisma.feedLike.create).toHaveBeenCalledWith({ data: { postId: 5, userId: 1 } });
    expect(revalidatePath).toHaveBeenCalled();
  });

  it('deletes the like when it already exists', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.feedLike.findUnique.mockResolvedValue({ id: 42 } as never);
    mockPrisma.feedLike.delete.mockResolvedValue({} as never);

    await toggleFeedLike(5);

    expect(mockPrisma.feedLike.delete).toHaveBeenCalledWith({ where: { id: 42 } });
    expect(mockPrisma.feedLike.create).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalled();
  });
});

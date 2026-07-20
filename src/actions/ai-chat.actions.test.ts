import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/actions/local-user.actions', () => ({
  getLocalUserLite: vi.fn(),
}));

vi.mock('@/lib/validate', () => ({
  validateInput: vi.fn((schema, data) => schema.parse(data)),
}));

import { getAiChatResponse } from '@/actions/ai-chat.actions';
import { getLocalUserLite } from '@/actions/local-user.actions';
import { prisma } from '@/lib/prisma';

const mockPrisma = vi.mocked(prisma) as unknown as {
  user: { findUnique: ReturnType<typeof vi.fn> };
};
const mockGetLocalUserLite = vi.mocked(getLocalUserLite);

describe('getAiChatResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when user is not logged in', async () => {
    mockGetLocalUserLite.mockResolvedValue(null);

    await expect(getAiChatResponse('hello')).rejects.toThrow('Unauthorized');
  });

  it('returns exam tip for exam-related message', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await getAiChatResponse('Як підготуватися до іспиту?');

    expect(result).toContain('іспит');
  });

  it('returns grade tip for grade-related message', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await getAiChatResponse('Як покращити оцінки?');

    expect(result).toContain('оцінк');
  });

  it('returns default response for unrelated message', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await getAiChatResponse('яка погода сьогодні?');

    expect(result).toContain('Я можу допомогти');
  });

  it('appends GPA context when student has low GPA', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.user.findUnique.mockResolvedValue({
      gpa: 45,
      courses: [{ name: 'Math', grade: 50 }],
      attendance: [{ present: 10, total: 20 }],
    } as never);

    const result = await getAiChatResponse('Як покращити оцінки?');

    expect(result).toContain('45.0');
    expect(result).toContain('Відвідуваність');
  });

  it('appends positive context when GPA is high', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.user.findUnique.mockResolvedValue({
      gpa: 85,
      courses: [],
      attendance: [],
    } as never);

    const result = await getAiChatResponse('мотивація');

    expect(result).toContain('85.0');
    expect(result).toContain('топі');
  });

  it('handles English keywords', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await getAiChatResponse('I have an exam tomorrow');

    expect(result).toContain('іспит');
  });

  it('throws on empty message (validation)', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);

    await expect(getAiChatResponse('')).rejects.toThrow();
  });

  it('throws on message exceeding 500 chars (validation)', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);

    await expect(getAiChatResponse('a'.repeat(501))).rejects.toThrow();
  });
});

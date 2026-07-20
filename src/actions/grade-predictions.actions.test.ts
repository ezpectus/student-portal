import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    course: {
      findMany: vi.fn(),
    },
    attendance: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/actions/local-user.actions', () => ({
  getLocalUserLite: vi.fn(),
}));

import { getGradePredictions } from '@/actions/grade-predictions.actions';
import { getLocalUserLite } from '@/actions/local-user.actions';
import { prisma } from '@/lib/prisma';

const mockPrisma = vi.mocked(prisma) as unknown as {
  course: { findMany: ReturnType<typeof vi.fn> };
  attendance: { findMany: ReturnType<typeof vi.fn> };
};
const mockGetLocalUserLite = vi.mocked(getLocalUserLite);

describe('getGradePredictions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when user is not logged in', async () => {
    mockGetLocalUserLite.mockResolvedValue(null);

    const result = await getGradePredictions();

    expect(result).toBeNull();
  });

  it('returns null when user has no courses', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.course.findMany.mockResolvedValue([]);

    const result = await getGradePredictions();

    expect(result).toBeNull();
  });

  it('returns predictions with correct GPA calculation', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.course.findMany.mockResolvedValue([
      { name: 'Math', grade: 80, credits: 4, gradeHistory: [] },
      { name: 'Physics', grade: 60, credits: 3, gradeHistory: [] },
    ] as never);
    mockPrisma.attendance.findMany.mockResolvedValue([
      { present: 18, total: 20 },
    ] as never);

    const result = await getGradePredictions();

    expect(result).not.toBeNull();
    expect(result!.courses).toHaveLength(2);
    expect(result!.totalCredits).toBe(7);
    expect(result!.currentGpa).toBe(Math.round((80 * 4 + 60 * 3) / 7 * 10) / 10);
  });

  it('marks high risk for low predicted grade', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.course.findMany.mockResolvedValue([
      { name: 'Math', grade: 40, credits: 4, gradeHistory: [] },
    ] as never);
    mockPrisma.attendance.findMany.mockResolvedValue([
      { present: 5, total: 20 },
    ] as never);

    const result = await getGradePredictions();

    expect(result!.courses[0].riskLevel).toBe('high');
    expect(result!.atRiskCourses).toBe(1);
    expect(result!.summaryKey).toBe('summary.critical');
  });

  it('detects upward trend from grade history', async () => {
    const dates = [new Date('2025-01-01'), new Date('2025-02-01'), new Date('2025-03-01')];
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.course.findMany.mockResolvedValue([
      {
        name: 'Math',
        grade: 70,
        credits: 4,
        gradeHistory: [
          { oldGrade: 50, newGrade: 60, createdAt: dates[0] },
          { oldGrade: 60, newGrade: 70, createdAt: dates[1] },
          { oldGrade: 70, newGrade: 80, createdAt: dates[2] },
        ],
      },
    ] as never);
    mockPrisma.attendance.findMany.mockResolvedValue([
      { present: 18, total: 20 },
    ] as never);

    const result = await getGradePredictions();

    expect(result!.courses[0].trend).toBe('up');
  });

  it('detects downward trend from grade history', async () => {
    const dates = [new Date('2025-01-01'), new Date('2025-02-01'), new Date('2025-03-01')];
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.course.findMany.mockResolvedValue([
      {
        name: 'Math',
        grade: 60,
        credits: 4,
        gradeHistory: [
          { oldGrade: 80, newGrade: 70, createdAt: dates[0] },
          { oldGrade: 70, newGrade: 60, createdAt: dates[1] },
          { oldGrade: 60, newGrade: 50, createdAt: dates[2] },
        ],
      },
    ] as never);
    mockPrisma.attendance.findMany.mockResolvedValue([
      { present: 18, total: 20 },
    ] as never);

    const result = await getGradePredictions();

    expect(result!.courses[0].trend).toBe('down');
  });

  it('returns stable trend for less than 2 history entries', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.course.findMany.mockResolvedValue([
      { name: 'Math', grade: 70, credits: 4, gradeHistory: [] },
    ] as never);
    mockPrisma.attendance.findMany.mockResolvedValue([
      { present: 18, total: 20 },
    ] as never);

    const result = await getGradePredictions();

    expect(result!.courses[0].trend).toBe('stable');
  });

  it('returns null on database error', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.course.findMany.mockRejectedValue(new Error('DB error'));

    const result = await getGradePredictions();

    expect(result).toBeNull();
  });

  it('sorts courses by predicted grade ascending', async () => {
    mockGetLocalUserLite.mockResolvedValue({ id: 1, role: 'STUDENT', schoolId: 1, tokenVersion: 0 } as never);
    mockPrisma.course.findMany.mockResolvedValue([
      { name: 'Math', grade: 90, credits: 4, gradeHistory: [] },
      { name: 'Physics', grade: 50, credits: 3, gradeHistory: [] },
    ] as never);
    mockPrisma.attendance.findMany.mockResolvedValue([
      { present: 18, total: 20 },
    ] as never);

    const result = await getGradePredictions();

    expect(result!.courses[0].courseName).toBe('Physics');
    expect(result!.courses[1].courseName).toBe('Math');
  });
});

'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

import { getLocalUser } from '@/actions/local-auth.actions';
import { logAuditEvent } from '@/actions/audit.actions';
import { DASHBOARD_CACHE_TAG, RATING_CACHE_TAG } from '@/lib/constants/cache-tags';
import { prisma } from '@/lib/prisma';
import { validateInput } from '@/lib/validate';

export interface TeacherCourse {
  name: string;
  credits: number;
  studentCount: number;
}

export interface CourseStudent {
  id: number;
  studentId: number;
  studentName: string;
  studentUsername: string;
  groupName: string | null;
  grade: number;
  gradeType: string;
  credits: number;
}

/**
 * Get all courses taught by the current teacher, grouped by name.
 * @returns Safe default on error: []. Never throws.
 */
export async function getTeacherCourses(): Promise<TeacherCourse[]> {
  const user = await getLocalUser();
  if (!user || user.role !== 'TEACHER') return [];

  try {
    const courses = await prisma.course.findMany({
      where: { teacherId: user.id },
      select: { name: true, credits: true, userId: true, gradeType: true },
    });

    const grouped = new Map<string, TeacherCourse>();
    for (const course of courses) {
      const existing = grouped.get(course.name);
      if (existing) {
        existing.studentCount += 1;
      } else {
        grouped.set(course.name, {
          name: course.name,
          credits: course.credits,
          studentCount: 1,
        });
      }
    }

    return Array.from(grouped.values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

/**
 * Get all students enrolled in a specific course (by name) taught by the current teacher.
 * @returns Safe default on error: []. Never throws.
 */
export async function getCourseStudents(courseName: string): Promise<CourseStudent[]> {
  const user = await getLocalUser();
  if (!user || user.role !== 'TEACHER') return [];

  try {
    const courses = await prisma.course.findMany({
      where: { name: courseName, teacherId: user.id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            groupName: true,
          },
        },
      },
    });

    return courses
      .map((c) => ({
        id: c.id,
        studentId: c.user.id,
        studentName: c.user.fullName,
        studentUsername: c.user.username,
        groupName: c.user.groupName,
        grade: c.grade,
        gradeType: c.gradeType,
        credits: c.credits,
      }))
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  } catch {
    return [];
  }
}

const updateGradeSchema = z.object({
  courseId: z.number().int().positive(),
  grade: z.number().min(0).max(100),
  gradeType: z.enum(['NUMERIC', 'LETTER', 'ECTS']).default('NUMERIC'),
});

/**
 * Update a student's grade for a specific course enrollment.
 * @throws {ValidationError} If input is invalid.
 * @throws {Error} If course doesn't belong to teacher or update fails.
 */
export async function updateGrade(input: z.infer<typeof updateGradeSchema>) {
  const validated = validateInput(updateGradeSchema, input, 'updateGrade');

  const user = await getLocalUser();
  if (!user || user.role !== 'TEACHER') {
    throw new Error('Only teachers can update grades');
  }

  const course = await prisma.course.findFirst({
    where: { id: validated.courseId, teacherId: user.id },
  });

  if (!course) {
    throw new Error('Course not found or not taught by this teacher');
  }

  await prisma.course.update({
    where: { id: validated.courseId },
    data: { grade: validated.grade, gradeType: validated.gradeType },
  });

  await prisma.gradeHistory.create({
    data: {
      courseId: validated.courseId,
      oldGrade: course.grade,
      newGrade: validated.grade,
      gradeType: validated.gradeType,
      changedBy: user.id,
    },
  });

  await logAuditEvent({
    action: 'update_grade',
    entity: 'Course',
    entityId: validated.courseId,
    metadata: { studentId: course.userId, oldGrade: course.grade, newGrade: validated.grade, gradeType: validated.gradeType, courseName: course.name },
  });

  revalidateTag(RATING_CACHE_TAG);
  revalidateTag(DASHBOARD_CACHE_TAG);
}

export interface GradeHistoryEntry {
  id: number;
  oldGrade: number;
  newGrade: number;
  gradeType: string;
  changedByName: string;
  createdAt: string;
}

/**
 * Get grade change history for a specific course.
 * @returns Safe default on error: []. Never throws.
 */
export async function getGradeHistory(courseId: number): Promise<GradeHistoryEntry[]> {
  const user = await getLocalUser();
  if (!user) return [];

  try {
    const history = await prisma.gradeHistory.findMany({
      where: { courseId },
      include: {
        changedByUser: {
          select: { fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return history.map((h) => ({
      id: h.id,
      oldGrade: h.oldGrade,
      newGrade: h.newGrade,
      gradeType: h.gradeType,
      changedByName: h.changedByUser.fullName,
      createdAt: h.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

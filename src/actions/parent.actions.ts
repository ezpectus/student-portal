'use server';

import { unstable_cache } from 'next/cache';

import { getLocalUserLite } from '@/actions/local-user.actions';
import { PARENT_CACHE_TAG } from '@/lib/constants/cache-tags';
import { displayGrade, type GradeType } from '@/lib/grade-utils';
import { prisma } from '@/lib/prisma';

export interface ParentChild {
  id: number;
  studentId: number;
  studentName: string;
  studentUsername: string;
  groupName: string | null;
  faculty: string | null;
  speciality: string | null;
  gpa: number;
  studyYear: number;
  photo: string;
}

export interface ChildCourse {
  id: number;
  name: string;
  grade: number;
  gradeType: string;
  credits: number;
  displayGrade: string;
  teacherName: string | null;
}

export interface ChildAttendance {
  id: number;
  month: string;
  present: number;
  total: number;
  rate: number;
}

/**
 * Get all children linked to the current parent user.
 * @returns Safe default on error: []. Never throws.
 */
export const getChildren = unstable_cache(
  async (): Promise<ParentChild[]> => {
    const user = await getLocalUserLite();
    if (!user || user.role !== 'PARENT') return [];

    try {
      const relations = await prisma.parentStudent.findMany({
        where: { parentId: user.id },
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              username: true,
              groupName: true,
              faculty: true,
              speciality: true,
              gpa: true,
              studyYear: true,
              photo: true,
            },
          },
        },
        orderBy: { student: { fullName: 'asc' } },
      });

      return relations.map((r: { id: number; student: { id: number; fullName: string; username: string; groupName: string | null; faculty: string | null; speciality: string | null; gpa: number; studyYear: number; photo: string } }) => ({
        id: r.id,
        studentId: r.student.id,
        studentName: r.student.fullName,
        studentUsername: r.student.username,
        groupName: r.student.groupName,
        faculty: r.student.faculty,
        speciality: r.student.speciality,
        gpa: r.student.gpa,
        studyYear: r.student.studyYear,
        photo: r.student.photo,
      }));
    } catch {
      return [];
    }
  },
  ['parent-children'],
  { revalidate: 60, tags: [PARENT_CACHE_TAG] },
);

/**
 * Get courses and grades for a specific child.
 * @returns Safe default on error: []. Never throws.
 */
export const getChildCourses = unstable_cache(
  async (studentId: number): Promise<ChildCourse[]> => {
    const user = await getLocalUserLite();
    if (!user || user.role !== 'PARENT') return [];

    try {
      const relation = await prisma.parentStudent.findFirst({
        where: { parentId: user.id, studentId },
      });
      if (!relation) return [];

      const courses = await prisma.course.findMany({
        where: { userId: studentId },
        include: {
          teacher: { select: { fullName: true } },
        },
        orderBy: { name: 'asc' },
      });

      return courses.map((c: { id: number; name: string; grade: number; gradeType: string; credits: number; teacher: { fullName: string } | null }) => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        gradeType: c.gradeType,
        credits: c.credits,
        displayGrade: displayGrade(c.grade, c.gradeType as GradeType),
        teacherName: c.teacher?.fullName ?? null,
      }));
    } catch {
      return [];
    }
  },
  ['parent-child-courses'],
  { revalidate: 60, tags: [PARENT_CACHE_TAG] },
);

/**
 * Get attendance records for a specific child.
 * @returns Safe default on error: []. Never throws.
 */
export const getChildAttendance = unstable_cache(
  async (studentId: number): Promise<ChildAttendance[]> => {
    const user = await getLocalUserLite();
    if (!user || user.role !== 'PARENT') return [];

    try {
      const relation = await prisma.parentStudent.findFirst({
        where: { parentId: user.id, studentId },
      });
      if (!relation) return [];

      const records = await prisma.attendance.findMany({
        where: { userId: studentId },
        orderBy: { month: 'asc' },
      });

      return records.map((a: { id: number; month: string; present: number; total: number }) => ({
        id: a.id,
        month: a.month,
        present: a.present,
        total: a.total,
        rate: a.total > 0 ? Math.round((a.present / a.total) * 100) : 0,
      }));
    } catch {
      return [];
    }
  },
  ['parent-child-attendance'],
  { revalidate: 60, tags: [PARENT_CACHE_TAG] },
);

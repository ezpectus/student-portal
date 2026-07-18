'use server';

import { revalidateTag } from 'next/cache';

import { logAuditEvent } from '@/actions/audit.actions';
import { getUserDetails } from '@/actions/auth.actions';
import { getLocalUser } from '@/actions/local-auth.actions';
import { ADMIN_CACHE_TAG } from '@/lib/constants/cache-tags';
import { UnauthorizedError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { UserCategory } from '@/types/enums/user-category';

const publicUserSelect = {
  id: true,
  username: true,
  email: true,
  fullName: true,
  photo: true,
  role: true,
  faculty: true,
  speciality: true,
  groupName: true,
  studyForm: true,
  status: true,
  studyYear: true,
  gpa: true,
  phone: true,
  address: true,
  birthDate: true,
  gradeBookNumber: true,
  codeOfHonorSigned: true,
  schoolId: true,
  createdAt: true,
  lastActiveAt: true,
} as const;

const requireAdmin = async () => {
  const localUser = await getLocalUser();
  if (localUser?.role === 'ADMIN') {
    return { schoolId: localUser.schoolId ?? undefined };
  }

  const remoteUser = await getUserDetails();
  if (!remoteUser?.userCategories?.includes(UserCategory.Admin)) {
    throw new UnauthorizedError('Admin access required');
  }

  return { schoolId: undefined as number | undefined };
};

interface AdminUserFilters {
  search: string;
  role: string;
  status: string;
  faculty: string;
}

export async function getAdminUsers(filters: AdminUserFilters) {
  const { schoolId } = await requireAdmin();
  const where: Record<string, unknown> = {};

  if (schoolId !== undefined) {
    where.schoolId = schoolId;
  }

  if (filters.search) {
    where.OR = [
      { fullName: { contains: filters.search } },
      { username: { contains: filters.search } },
      { email: { contains: filters.search } },
      { speciality: { contains: filters.search } },
    ];
  }

  if (filters.role !== 'all') {
    where.role = filters.role;
  }

  if (filters.status !== 'all') {
    where.status = filters.status;
  }

  if (filters.faculty !== 'all') {
    where.faculty = filters.faculty;
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: publicUserSelect,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total };
}

export async function getAdminUserById(id: number) {
  const { schoolId } = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      ...publicUserSelect,
      courses: true,
      attendance: true,
    },
  });

  if (!user) return null;
  if (schoolId !== undefined && user.schoolId !== schoolId) return null;

  return user;
}

export async function getAdminStats() {
  const { schoolId } = await requireAdmin();
  const schoolFilter = schoolId !== undefined ? { schoolId } : {};

  const [totalUsers, students, lecturers, activeStudents, onLeave, dismissed] = await Promise.all([
    prisma.user.count({ where: schoolFilter }),
    prisma.user.count({ where: { role: 'STUDENT', ...schoolFilter } }),
    prisma.user.count({ where: { role: 'TEACHER', ...schoolFilter } }),
    prisma.user.count({ where: { role: 'STUDENT', status: 'Studying', ...schoolFilter } }),
    prisma.user.count({ where: { role: 'STUDENT', status: 'OnAcademicLeave', ...schoolFilter } }),
    prisma.user.count({ where: { role: 'STUDENT', status: 'Dismissed', ...schoolFilter } }),
  ]);

  const studentsData = await prisma.user.findMany({
    where: { role: 'STUDENT', ...schoolFilter },
    select: { gpa: true },
  });

  const avgGpa = studentsData.length > 0
    ? Math.round((studentsData.reduce((sum: number, u: { gpa: number }) => sum + u.gpa, 0) / studentsData.length) * 100) / 100
    : 0;

  return {
    totalUsers,
    students,
    lecturers,
    activeStudents,
    onLeave,
    dismissed,
    avgGpa,
  };
}

export async function getFaculties(): Promise<string[]> {
  const { schoolId } = await requireAdmin();

  const result = await prisma.user.findMany({
    where: { faculty: { not: null }, ...(schoolId !== undefined ? { schoolId } : {}) },
    select: { faculty: true },
    distinct: ['faculty'],
  });
  return result.map((r: { faculty: string | null }) => r.faculty).filter((f: string | null): f is string => f !== null);
}

export async function deleteUser(id: number): Promise<{ ok: boolean }> {
  const { schoolId } = await requireAdmin();

  try {
    const { count } = await prisma.user.deleteMany({
      where: { id, ...(schoolId !== undefined ? { schoolId } : {}) },
    });
    if (count > 0) {
      await logAuditEvent({ action: 'delete', entity: 'User', entityId: id });
      revalidateTag(ADMIN_CACHE_TAG);
    }
    return { ok: count > 0 };
  } catch {
    return { ok: false };
  }
}

export async function updateUserStatus(id: number, status: string): Promise<{ ok: boolean }> {
  const { schoolId } = await requireAdmin();

  try {
    const { count } = await prisma.user.updateMany({
      where: { id, ...(schoolId !== undefined ? { schoolId } : {}) },
      data: { status },
    });
    if (count > 0) {
      await logAuditEvent({ action: 'update_status', entity: 'User', entityId: id, metadata: { status } });
      revalidateTag(ADMIN_CACHE_TAG);
    }
    return { ok: count > 0 };
  } catch {
    return { ok: false };
  }
}

export async function getDbStats() {
  const { schoolId } = await requireAdmin();
  const schoolFilter = schoolId !== undefined ? { schoolId } : {};

  const [users, courses, attendance, notifications] = await Promise.all([
    prisma.user.count({ where: schoolFilter }),
    prisma.course.count({ where: schoolFilter }),
    prisma.attendance.count({ where: schoolId !== undefined ? { user: { schoolId } } : {} }),
    prisma.notification.count({ where: schoolId !== undefined ? { user: { schoolId } } : {} }),
  ]);

  return { users, courses, attendance, notifications };
}

export async function getDbTableData(table: string, page: number = 1, pageSize: number = 20) {
  const { schoolId } = await requireAdmin();
  const skip = (page - 1) * pageSize;
  const schoolWhere = schoolId !== undefined ? { schoolId } : {};
  const schoolUserWhere = schoolId !== undefined ? { user: { schoolId } } : {};

  switch (table) {
    case 'users': {
      const [items, total] = await Promise.all([
        prisma.user.findMany({ skip, take: pageSize, orderBy: { id: 'asc' }, where: schoolWhere, select: publicUserSelect }),
        prisma.user.count({ where: schoolWhere }),
      ]);
      return { items, total };
    }
    case 'courses': {
      const [items, total] = await Promise.all([
        prisma.course.findMany({ skip, take: pageSize, orderBy: { id: 'asc' }, where: schoolWhere, include: { user: { select: { fullName: true } } } }),
        prisma.course.count({ where: schoolWhere }),
      ]);
      return { items, total };
    }
    case 'attendance': {
      const [items, total] = await Promise.all([
        prisma.attendance.findMany({ skip, take: pageSize, orderBy: { id: 'asc' }, where: schoolUserWhere, include: { user: { select: { fullName: true } } } }),
        prisma.attendance.count({ where: schoolUserWhere }),
      ]);
      return { items, total };
    }
    case 'notifications': {
      const [items, total] = await Promise.all([
        prisma.notification.findMany({ skip, take: pageSize, orderBy: { id: 'desc' }, where: schoolUserWhere, include: { user: { select: { fullName: true } } } }),
        prisma.notification.count({ where: schoolUserWhere }),
      ]);
      return { items, total };
    }
    default:
      return { items: [], total: 0 };
  }
}

'use server';

import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';

import { getLocalUserLite } from '@/actions/local-user.actions';
import { requireCsrf } from '@/lib/csrf';
import { prisma } from '@/lib/prisma';

/**
 * Generate a one-time QR token for attendance session.
 * Token expires in 5 minutes.
 */
export async function generateAttendanceQR(courseName: string) {
  await requireCsrf();
  const user = await getLocalUserLite();
  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    throw new Error('Unauthorized');
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.attendanceSession.create({
    data: {
      token,
      courseName,
      teacherId: user.id,
      schoolId: user.schoolId ?? null,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

/**
 * Verify a QR token and mark attendance for a student.
 * Multiple students can scan the same QR code within the expiry window.
 */
export async function verifyAttendanceQR(token: string) {
  await requireCsrf();
  const user = await getLocalUserLite();
  if (!user || user.role !== 'STUDENT') {
    throw new Error('Unauthorized');
  }

  const session = await prisma.attendanceSession.findFirst({
    where: {
      token,
      expiresAt: { gt: new Date() },
      ...(user.schoolId ? { schoolId: user.schoolId } : {}),
    },
  });

  if (!session) {
    return { ok: false, error: 'invalid-or-expired' as const };
  }

  const monthKey = new Date().toISOString().slice(0, 7);

  await prisma.$transaction([
    prisma.attendance.upsert({
      where: { userId_month: { userId: user.id, month: monthKey } },
      update: { present: { increment: 1 }, total: { increment: 1 } },
      create: { userId: user.id, month: monthKey, present: 1, total: 1 },
    }),
  ]);

  revalidatePath('/module/rating');
  return { ok: true, courseName: session.courseName };
}

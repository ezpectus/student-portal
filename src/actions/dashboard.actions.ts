'use server';

import { getLocalUser } from '@/actions/local-auth.actions';
import { prisma } from '@/lib/prisma';

interface DashboardMetrics {
  averageScore: number;
  creditsEarned: number;
  coursesActive: number;
  attendanceRate: number;
}

interface GpaTrendPoint {
  semester: string;
  gpa: number;
}

interface GradeDistributionPoint {
  name: string;
  value: number;
  color: string;
}

interface AttendancePoint {
  month: string;
  attended: number;
  missed: number;
}

interface DashboardData {
  metrics: DashboardMetrics;
  gpaTrend: GpaTrendPoint[];
  gradeDistribution: GradeDistributionPoint[];
  attendanceData: AttendancePoint[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const user = await getLocalUser();
  if (!user) {
    return {
      metrics: { averageScore: 0, creditsEarned: 0, coursesActive: 0, attendanceRate: 0 },
      gpaTrend: [],
      gradeDistribution: [],
      attendanceData: [],
    };
  }

  const [courses, attendance] = await Promise.all([
    prisma.course.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, grade: true, credits: true },
    }),
    prisma.attendance.findMany({
      where: { userId: user.id },
      orderBy: { month: 'asc' },
      select: { id: true, month: true, present: true, total: true },
    }),
  ]);

  const averageScore = courses.length > 0
    ? Math.round((courses.reduce((sum: number, c: { grade: number }) => sum + c.grade, 0) / courses.length) * 100) / 100
    : 0;

  const creditsEarned = courses.reduce((sum: number, c: { credits: number }) => sum + c.credits, 0);
  const coursesActive = courses.length;

  const totalPresent = attendance.reduce((sum: number, a: { present: number }) => sum + a.present, 0);
  const totalTotal = attendance.reduce((sum: number, a: { total: number }) => sum + a.total, 0);
  const attendanceRate = totalTotal > 0 ? Math.round((totalPresent / totalTotal) * 100) : 0;

  const gradeBuckets = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  for (const c of courses) {
    if (c.grade >= 90) gradeBuckets.A++;
    else if (c.grade >= 80) gradeBuckets.B++;
    else if (c.grade >= 70) gradeBuckets.C++;
    else if (c.grade >= 60) gradeBuckets.D++;
    else gradeBuckets.F++;
  }

  const gradeDistribution: GradeDistributionPoint[] = [
    { name: 'A', value: gradeBuckets.A, color: '#22c55e' },
    { name: 'B', value: gradeBuckets.B, color: '#3b82f6' },
    { name: 'C', value: gradeBuckets.C, color: '#f59e0b' },
    { name: 'D', value: gradeBuckets.D, color: '#f97316' },
    { name: 'F', value: gradeBuckets.F, color: '#ef4444' },
  ];

  const attendanceData: AttendancePoint[] = attendance.map((a: { month: string; present: number; total: number }) => ({
    month: a.month,
    attended: a.present,
    missed: a.total - a.present,
  }));

  const gpaTrend: GpaTrendPoint[] = [
    { semester: '1', gpa: averageScore },
  ];

  return {
    metrics: {
      averageScore,
      creditsEarned,
      coursesActive,
      attendanceRate,
    },
    gpaTrend,
    gradeDistribution,
    attendanceData,
  };
}

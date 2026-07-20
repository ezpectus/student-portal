'use server';

import { getLocalUserLite } from '@/actions/local-user.actions';
import { prisma } from '@/lib/prisma';

export interface CoursePrediction {
  courseName: string;
  currentGrade: number;
  predictedGrade: number;
  credits: number;
  trend: 'up' | 'down' | 'stable';
  riskLevel: 'low' | 'medium' | 'high';
  reasonKeys: string[];
}

export interface SemesterPrediction {
  currentGpa: number;
  predictedGpa: number;
  totalCredits: number;
  atRiskCourses: number;
  courses: CoursePrediction[];
  summaryKey: string;
  summaryParams: { atRiskCount?: number };
}

function calculateTrend(history: { oldGrade: number; newGrade: number; createdAt: Date }[]): 'up' | 'down' | 'stable' {
  if (history.length < 2) return 'stable';

  const sorted = [...history].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const recentGrades = sorted.slice(-3).map((h) => h.newGrade);
  const avgRecent = recentGrades.reduce((a, b) => a + b, 0) / recentGrades.length;
  const avgOld = sorted.slice(0, -1).map((h) => h.oldGrade).reduce((a, b) => a + b, 0) / Math.max(sorted.length - 1, 1);

  const diff = avgRecent - avgOld;
  if (diff > 3) return 'up';
  if (diff < -3) return 'down';
  return 'stable';
}

function predictGrade(
  currentGrade: number,
  trend: 'up' | 'down' | 'stable',
  attendanceRate: number,
): number {
  let predicted = currentGrade;

  if (trend === 'up') predicted += 4;
  if (trend === 'down') predicted -= 6;

  if (attendanceRate < 50) predicted -= 10;
  else if (attendanceRate < 70) predicted -= 5;
  else if (attendanceRate >= 90) predicted += 3;

  return Math.max(0, Math.min(100, Math.round(predicted)));
}

function getRiskLevel(predictedGrade: number, attendanceRate: number): 'low' | 'medium' | 'high' {
  if (predictedGrade < 50 || attendanceRate < 50) return 'high';
  if (predictedGrade < 60 || attendanceRate < 70) return 'medium';
  return 'low';
}

function getRiskReasonKeys(predictedGrade: number, attendanceRate: number, trend: 'up' | 'down' | 'stable'): string[] {
  const reasons: string[] = [];

  if (predictedGrade < 50) reasons.push('below-passing');
  if (attendanceRate < 50) reasons.push('critical-attendance');
  if (trend === 'down') reasons.push('grades-declining');
  if (predictedGrade >= 85 && trend === 'up') reasons.push('stable-growth');
  if (reasons.length === 0 && predictedGrade >= 60) reasons.push('stable');

  return reasons;
}

function getSummaryKey(predictedGpa: number, atRiskCount: number, totalCourses: number): { key: string; params: { atRiskCount?: number } } {
  if (atRiskCount === 0) {
    if (predictedGpa >= 85) return { key: 'summary.excellent', params: {} };
    if (predictedGpa >= 70) return { key: 'summary.good', params: {} };
    return { key: 'summary.satisfactory', params: {} };
  }

  if (atRiskCount >= totalCourses / 2) {
    return { key: 'summary.critical', params: {} };
  }

  return { key: 'summary.at-risk', params: { atRiskCount } };
}

export async function getGradePredictions(): Promise<SemesterPrediction | null> {
  const user = await getLocalUserLite();
  if (!user) return null;

  try {
    const courses = await prisma.course.findMany({
      where: { userId: user.id },
      include: {
        gradeHistory: {
          select: { oldGrade: true, newGrade: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (courses.length === 0) return null;

    const attendance = await prisma.attendance.findMany({
      where: { userId: user.id },
      select: { present: true, total: true },
    });

    const totalPresent = attendance.reduce((a, b) => a + b.present, 0);
    const totalTotal = attendance.reduce((a, b) => a + b.total, 0);
    const attendanceRate = totalTotal > 0 ? (totalPresent / totalTotal) * 100 : 100;

    const coursePredictions: CoursePrediction[] = courses.map((course) => {
      const trend = calculateTrend(course.gradeHistory);
      const predicted = predictGrade(course.grade, trend, attendanceRate);
      const risk = getRiskLevel(predicted, attendanceRate);

      return {
        courseName: course.name,
        currentGrade: Math.round(course.grade),
        predictedGrade: predicted,
        credits: course.credits,
        trend,
        riskLevel: risk,
        reasonKeys: getRiskReasonKeys(predicted, attendanceRate, trend),
      };
    });

    const totalCredits = courses.reduce((a, b) => a + b.credits, 0);
    const currentGpa = courses.reduce((a, b) => a + b.grade * b.credits, 0) / Math.max(totalCredits, 1);
    const predictedGpa = coursePredictions.reduce((a, b) => a + b.predictedGrade * b.credits, 0) / Math.max(totalCredits, 1);
    const atRiskCount = coursePredictions.filter((c) => c.riskLevel === 'high').length;

    return {
      currentGpa: Math.round(currentGpa * 10) / 10,
      predictedGpa: Math.round(predictedGpa * 10) / 10,
      totalCredits,
      atRiskCourses: atRiskCount,
      courses: coursePredictions.sort((a, b) => a.predictedGrade - b.predictedGrade),
      summaryKey: getSummaryKey(Math.round(predictedGpa), atRiskCount, courses.length).key,
      summaryParams: getSummaryKey(Math.round(predictedGpa), atRiskCount, courses.length).params,
    };
  } catch {
    return null;
  }
}
